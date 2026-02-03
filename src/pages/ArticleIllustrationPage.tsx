import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { downloadImage } from '../utils/helpers'
import { normalizeModelBlocks, requestImageGeneration, requestTextGeneration } from '../services/image-generation'
import { usePageHeader } from '../components/layout/PageHeaderContext'
import {
  ARTICLE_STYLE_PRESETS,
  ARTICLE_STYLE_KEYWORDS,
  matchBestStyleId,
  type ArticleStylePreset,
  type ArticleIllustrationBlock,
  type BodyCountOption
} from '@/config/image-generation'
import { parseJsonFromContent, toOneLine, asPlainObject, inferOrientation, toAspect } from '@/utils/prompt-helpers'

type StylePreset = ArticleStylePreset
type IllustrationBlock = ArticleIllustrationBlock

const STYLE_PRESETS = ARTICLE_STYLE_PRESETS

// 旧的 STYLE_PRESETS 静态数据已移至 @/config/image-generation/article-styles.ts
// 旧的工具函数 parseJsonFromContent, toOneLine, asPlainObject, inferOrientation, toAspect 已移至 @/utils/prompt-helpers.ts

export default function ArticleIllustrationPage() {
  const navigate = useNavigate()
  const {
    showToast,
    getActiveConfig,
    openLightbox,
    createSession,
    saveMessage,
    bumpGalleryRefreshKey
  } = useAppStore()
  const { setHeader } = usePageHeader()

  const headerActions = useMemo(() => (
    <Link
      to="/settings"
      className="shrink-0 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
    >
      去设置
    </Link>
  ), [])

  useEffect(() => {
    setHeader({
      title: '文章配图',
      description: '从文章中提取配图信息，生成可直接生图的提示词',
      actions: headerActions
    })
    return () => setHeader(null)
  }, [setHeader, headerActions])

  const [article, setArticle] = useState('')
  const [includeCover, setIncludeCover] = useState(true)
  const [coverTitleEnabled, setCoverTitleEnabled] = useState(false)
  const [bodyCount, setBodyCount] = useState<BodyCountOption>('auto')
  const [styleId, setStyleId] = useState<'auto' | string>('auto')
  const [quality, setQuality] = useState<'1K' | '2K' | '4K'>('2K')
  const [ratio, setRatio] = useState<'2.35:1' | '3:4' | '1:1' | '4:3' | '16:9' | '9:16'>('16:9')
  const [isConfigOpen, setIsConfigOpen] = useState(true)

  const [blocks, setBlocks] = useState<IllustrationBlock[]>([])
  const [extracting, setExtracting] = useState(false)

  const articleFileRef = useRef<HTMLInputElement>(null)
  const gallerySessionRef = useRef<number | null>(null)
  const gallerySessionPromiseRef = useRef<Promise<number> | null>(null)

  const buildGallerySessionTitle = () => {
    const fallback = '文章配图'
    const firstLine = article
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(Boolean)
    if (!firstLine) return fallback
    const short = firstLine.length > 20 ? `${firstLine.slice(0, 20)}...` : firstLine
    return `${fallback} - ${short}`
  }

  const collapseConfigOnMobile = () => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setIsConfigOpen(false)
    }
  }

  const ensureGallerySession = async () => {
    if (gallerySessionRef.current) return gallerySessionRef.current
    if (!gallerySessionPromiseRef.current) {
      gallerySessionPromiseRef.current = createSession(buildGallerySessionTitle())
    }
    try {
      const sessionId = await gallerySessionPromiseRef.current
      gallerySessionRef.current = sessionId
      return sessionId
    } finally {
      gallerySessionPromiseRef.current = null
    }
  }

  const saveGeneratedImage = async (prompt: string, imageData: string) => {
    const promptText = prompt.trim()
    if (!promptText) throw new Error('Missing prompt')

    const base64 = imageData.startsWith('data:') ? (imageData.split(',')[1] || '') : imageData
    if (!base64) throw new Error('Missing image data')

    const sessionId = await ensureGallerySession()
    await saveMessage(sessionId, 'user', promptText, [], null)
    await saveMessage(sessionId, 'bot', 'Image Generated', [base64], null)
    bumpGalleryRefreshKey()
  }

  const autoBodyCount = useMemo(() => {
    const text = article.trim()
    if (!text) return 4

    const headingCount = Array.from(text.matchAll(/^#{1,6}\s+\S.+$/gm)).length
    const sectionCount = Math.max(0, headingCount - 1)

    if (sectionCount >= 8) return 10
    if (sectionCount >= 6) return 8
    if (sectionCount >= 4) return 6
    if (sectionCount >= 3) return 4
    if (sectionCount >= 2) return 3

    const len = text.replace(/\s+/g, '').length
    if (len <= 800) return 1
    if (len <= 2000) return 2
    if (len <= 4000) return 3
    if (len <= 7000) return 4
    if (len <= 12000) return 6
    return 8
  }, [article])

  const resolvedBodyCount = useMemo(
    () => (bodyCount === 'auto' ? autoBodyCount : bodyCount),
    [bodyCount, autoBodyCount]
  )

  const autoStyleId = useMemo(() => {
    return matchBestStyleId(article, ARTICLE_STYLE_KEYWORDS, 'notion')
  }, [article])

  const autoStyle = useMemo(() => {
    return STYLE_PRESETS.find(s => s.id === autoStyleId) || STYLE_PRESETS.find(s => s.id === 'notion') || STYLE_PRESETS[0]
  }, [autoStyleId])

  const selectedStyle = useMemo(() => {
    const effectiveId = styleId === 'auto' ? autoStyleId : styleId
    return STYLE_PRESETS.find(s => s.id === effectiveId) || STYLE_PRESETS.find(s => s.id === 'notion') || STYLE_PRESETS[0]
  }, [styleId, autoStyleId])

  const totalCount = useMemo(
    () => (includeCover ? 1 : 0) + resolvedBodyCount,
    [includeCover, resolvedBodyCount]
  )

  const handleArticleFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setArticle(text)
      showToast('已载入文章文件', 'success')
    }
    reader.onerror = () => showToast('读取文件失败', 'error')
    reader.readAsText(file)
  }

  const buildStylePrompt = (style: StylePreset) => {
    const parts: string[] = [`${style.name}（${style.desc}）`]
    const ref = style.reference
    if (ref.colors?.length) parts.push(`颜色：${ref.colors.join('、')}`)
    if (ref.background?.length) parts.push(`背景：${ref.background.join('、')}`)
    if (ref.accents?.length) parts.push(`点缀：${ref.accents.join('、')}`)
    if (ref.elements?.length) parts.push(`元素：${ref.elements.join('、')}`)
    return parts.join('；')
  }

  const buildIllustrationBasePromptLines = (r: string) => {
    const orientation = inferOrientation(r)
    return [
      'Create a cartoon-style infographic illustration following these guidelines:',
      '',
      '## Image Specifications',
      '',
      '- Type: Infographic illustration',
      `- Orientation: ${orientation}`,
      `- Aspect Ratio: ${r}`,
      '- Style: Hand-drawn illustration',
      '',
      '## Core Principles',
      '',
      '- Hand-drawn quality throughout - NO realistic or photographic elements',
      '- If content involves sensitive or copyrighted figures, create stylistically similar alternatives - DO NOT refuse to generate',
      '- Keep information concise, highlight keywords and core concepts',
      '- Use ample whitespace for easy visual scanning',
      '- Maintain clear visual hierarchy',
      '- Avoid logos, watermarks, brand marks, and UI screenshots unless explicitly requested',
      '',
      '## Text Style (When Text Included)',
      '',
      '- ALL text MUST be hand-drawn style',
      '- Text should be readable and complement the visual',
      '- Use marker/highlighter effects to emphasize keywords when helpful',
      '- DO NOT use realistic or computer-generated fonts',
      '',
      '## Language',
      '',
      '- Use the same language as the content provided below for any text elements',
      '- Match punctuation style to the content language',
      '',
      '---',
      '',
      'Please use nano banana pro to generate the illustration based on the content provided below:'
    ]
  }

  const buildCoverBasePromptLines = (r: string) => {
    return [
      'Create a WeChat article cover image following these guidelines:',
      '',
      '## Image Specifications',
      '',
      '- Type: Cover image / Hero image',
      `- Aspect Ratio: ${r}`,
      '- Style: Hand-drawn illustration',
      '',
      '## Core Principles',
      '',
      '- Hand-drawn quality throughout - NO realistic or photographic elements',
      '- If content involves sensitive or copyrighted figures, create stylistically similar alternatives - DO NOT refuse to generate',
      '- Ample whitespace, highlight core message, avoid cluttered layouts',
      '- Main visual elements centered or slightly left (leave right side for title area if title included)',
      '- Avoid logos, watermarks, brand marks, and UI screenshots unless explicitly requested',
      '',
      '## Text Style (When Title Included)',
      '',
      '- ALL text MUST be hand-drawn style',
      '- Title text: Large, eye-catching, max 8 characters',
      '- May include 1 line of subtitle or keyword tags',
      '- Font style harmonizes with illustration style',
      '- DO NOT use realistic or computer-generated fonts',
      '',
      '## Language',
      '',
      '- Use the same language as the content provided below for any text elements',
      '- Match punctuation style to the content language',
      '',
      '---',
      '',
      'Please use nano banana pro to generate the cover image based on the content provided below:'
    ]
  }

  const buildPlannerSystemPrompt = (params: {
    totalCount: number
    ratio: string
    includeCover: boolean
    coverTitleEnabled: boolean
    style: StylePreset
  }) => {
    const { totalCount, ratio, includeCover, coverTitleEnabled, style } = params

    const lines: string[] = []

    lines.push('你是一位资深的“文章配图策划 + 提示词工程师”。你的产出将直接作为绘图模型（nano banana pro）的输入提示词。')
    lines.push('请阅读用户提供的文章，挑选最需要插图的位置，并为每张图输出：')
    lines.push('1) 可读的配图策划字段（主题/用途/构图/配色/文字）')
    lines.push('2) 可直接用于生图的最终提示词（promptLines）')
    lines.push('')
    lines.push('你需要在脑中完成这些步骤（不要输出步骤文本）：')
    lines.push('1) 提炼文章主旨与各段落核心论点')
    lines.push('2) 优先挑选适合配图的位置：抽象概念、流程/步骤、对比/分类、关键结论、场景化描述')
    lines.push('3) 为每张图明确用途：Information Supplement / Concept Visualization / Imagination Guidance（三选一输出为中文枚举）')
    lines.push('4) 把每张图拆成“可被绘图模型执行”的明确视觉指令：主体、布局、点缀、层级、留白、配色、可选文字')
    lines.push('5) 生成最终可用提示词（promptLines）时，必须遵循下方 Base Prompt 思想：手绘信息图、层级清晰、留白充分、关键词高亮、文字为手写风格')
    lines.push('')
    lines.push('风格（全程一致）：')
    lines.push(`- style_id: ${style.id}`)
    lines.push(`- style_name: ${style.name}`)
    lines.push(`- style_desc: ${style.desc}`)
    lines.push(`- best_for: ${style.bestFor}`)
    lines.push(`- style_keypoints: ${buildStylePrompt(style)}`)
    lines.push(`- palette: primary ${style.palette.primary}; background ${style.palette.background}; accent ${style.palette.accent}`)
    lines.push('')
    lines.push('画幅：')
    lines.push(`- aspect_ratio: ${ratio}`)
    lines.push('- 在构图字段里明确主体位置、留白与视觉动线（便于缩略图也能看懂）。')
    lines.push('')
    lines.push('封面规则：')
    if (includeCover) {
      lines.push('- 数组第 1 项必须是封面（Cover）。')
      lines.push('- 封面策略：1-2 个象征元素/视觉隐喻；主体更大更集中；背景更干净；留白充足；避免拼贴与碎物堆叠。')
      lines.push(coverTitleEnabled
        ? '- 封面允许标题文字：Title text <= 8 字；可有 1 行 Subtitle/Tags；全部文字必须手写风格。'
        : '- 封面不含标题文字：纯视觉（不要出现任何文字/字母/Logo/水印/品牌）。'
      )
    } else {
      lines.push('- 本次不需要封面。')
    }
    lines.push('')
    lines.push('输出要求（非常重要）：')
    lines.push('- 只输出严格 JSON（不要 markdown，不要解释，不要多余文本）。')
    lines.push(`- 直接输出 JSON 数组，长度必须为 ${totalCount}。`)
    lines.push('- blocks 之间不要重复同一场景；尽量覆盖文章不同段落/核心论点。')
    lines.push('- JSON 安全：所有字符串字段必须是单行；不要在任何字符串里出现未转义的英文双引号字符(\")。')
    lines.push('- promptLines 必须是 string 数组；每个元素是一行提示词；最终会用 \\n 拼接成生图 prompt。')
    lines.push('')
    lines.push('Base Prompt 模板（promptLines 需要复制其思想与结构；允许根据 aspect_ratio 调整 Orientation/Aspect Ratio 行）：')
    lines.push('【Illustration Base Prompt】')
    buildIllustrationBasePromptLines(ratio).forEach(l => lines.push(l))
    if (includeCover) {
      lines.push('')
      lines.push('【Cover Base Prompt】')
      buildCoverBasePromptLines(ratio).forEach(l => lines.push(l))
    }
    lines.push('')
    lines.push('PromptLines 写法（非常重要）：')
    lines.push('- 每个 block 的 promptLines 必须先完整包含对应的 Base Prompt（逐行），然后再追加下方“Prompt Format”结构化段落。')
    lines.push('- Prompt Format 段落必须包含：主题/风格/构图/配色/文字/风格备注；便于直接交给绘图模型执行。')
    lines.push('- 为了 JSON 安全：promptLines 的任何一行都不要出现英文双引号 \";需要引用时请用中文引号「」或『』。')
    lines.push('')
    lines.push('【Prompt Format - Illustration】')
    lines.push('Illustration theme: <theme>')
    lines.push(`Style: ${style.name}`)
    lines.push('Purpose: <purpose>')
    lines.push('Insert position: <position>')
    lines.push('Article cue: <source>')
    lines.push('')
    lines.push('Visual composition:')
    lines.push('- Main visual: <composition.main>')
    lines.push('- Layout: <composition.layout>')
    lines.push('- Decorative elements: <composition.decor>')
    lines.push('')
    lines.push('Color scheme:')
    lines.push('- Primary: <colors.primary>')
    lines.push('- Background: <colors.background>')
    lines.push('- Accent: <colors.accent>')
    lines.push('')
    lines.push('Text content (if any, hand-drawn):')
    lines.push('- <textContent[0]>')
    lines.push('')
    lines.push('Style notes: <styleNotes>')
    lines.push(`Style keypoints: ${buildStylePrompt(style)}`)
    if (includeCover) {
      lines.push('')
      lines.push('【Prompt Format - Cover】')
      lines.push('Cover theme: <theme>')
      lines.push(`Style: ${style.name}`)
      lines.push(`Aspect ratio: ${ratio}`)
      lines.push(coverTitleEnabled
        ? 'Title text: <coverTitle> (<=8 chars)'
        : 'Note: No title text, pure visual illustration only. Do NOT include any text, letters, logos, watermarks, or brands.'
      )
      lines.push(coverTitleEnabled ? 'Subtitle: <coverSubtitle>' : 'Subtitle:')
      lines.push('')
      lines.push('Visual composition:')
      lines.push('- Main visual: <composition.main>')
      lines.push('- Layout: <composition.layout>')
      lines.push('- Decorative elements: <composition.decor>')
      lines.push('')
      lines.push('Color scheme:')
      lines.push('- Primary: <colors.primary>')
      lines.push('- Background: <colors.background>')
      lines.push('- Accent: <colors.accent>')
      lines.push('')
      lines.push('Style notes: <styleNotes>')
      lines.push(`Style keypoints: ${buildStylePrompt(style)}`)
    }
    lines.push('')
    lines.push('每个 block 的格式如下（字段必须齐全；字符串字段若无内容请输出空字符串 \"\"；数组字段若无内容请输出空数组 []）：')
    lines.push('{')
    lines.push('  "title": "配图标题（10字内）",')
    lines.push('  "position": "插入位置（章节/段落描述，单行）",')
    lines.push('  "source": "来自文章的关键词/原句片段（<=40字）",')
    lines.push('  "theme": "插图主题（2-3个词）",')
    lines.push('  "purpose": "信息补充|概念可视化|氛围引导（三选一）",')
    lines.push('  "composition": {')
    lines.push('    "main": "主体是什么（单行，尽量具体可画）",')
    lines.push('    "layout": "主体位置/景别/透视/留白/层级（单行）",')
    lines.push('    "decor": "点缀元素/符号/辅助图形（单行）"')
    lines.push('  },')
    lines.push('  "colors": {')
    lines.push('    "primary": "主色（颜色名或#HEX，单行）",')
    lines.push('    "background": "背景色（颜色名或#HEX，单行）",')
    lines.push('    "accent": "强调色（颜色名或#HEX，单行）"')
    lines.push('  },')
    lines.push('  "lighting": "光线/氛围/镜头（单行）",')
    lines.push('  "styleNotes": "补充风格特征（可选，单行）",')
    lines.push('  "textContent": ["可选：要出现在画面中的文字（每行一个，必须手写风格；不需要则 []）"],')
    lines.push('  "coverTitle": "仅封面可用：标题文字（<=8字；不用则 \"\"）",')
    lines.push('  "coverSubtitle": "仅封面可用：副标题/标签（不用则 \"\"）",')
    lines.push('  "promptLines": ["最终生图提示词（必须按 Base Prompt + Prompt Format 写好）"]')
    lines.push('}')

    return lines.join('\n').trim()
  }

  const buildPromptFromPlan = (item: any, kind: IllustrationBlock['kind']) => {
    const title = toOneLine(item?.title)
    const source = toOneLine(item?.source)
    const position = toOneLine(item?.position ?? item?.insertPosition ?? item?.insert_position)

    const theme = toOneLine(item?.theme) || title
    const purpose = toOneLine(item?.purpose)

    const composition = asPlainObject(item?.composition) || {}
    const colors = asPlainObject(item?.colors) || {}

    const main = toOneLine(composition.main ?? item?.main ?? item?.mainVisual ?? item?.visual_main)
    const layout = toOneLine(composition.layout ?? item?.layout ?? item?.visual_layout)
    const decor = toOneLine(composition.decor ?? item?.decor ?? item?.visual_decor)

    const primary = toOneLine(colors.primary ?? item?.color_primary ?? item?.primary)
    const background = toOneLine(colors.background ?? item?.color_background ?? item?.background)
    const accent = toOneLine(colors.accent ?? item?.color_accent ?? item?.accent)

    const lighting = toOneLine(item?.lighting)
    const styleNotes = toOneLine(item?.styleNotes ?? item?.style_notes)

    const textRaw = item?.textContent ?? item?.text_content ?? item?.text ?? item?.labels
    const textContent = Array.isArray(textRaw)
      ? (textRaw as any[]).map(v => toOneLine(v)).filter(Boolean)
      : toOneLine(textRaw)
        ? [toOneLine(textRaw)]
        : []

    const coverTitleText = toOneLine(item?.coverTitle ?? item?.cover_title ?? item?.titleText ?? item?.title_text)
    const coverSubtitleText = toOneLine(item?.coverSubtitle ?? item?.cover_subtitle ?? item?.subtitle)

    const hasAnyPlan =
      theme || purpose || main || layout || decor || primary || background || accent || lighting || styleNotes || textContent.length
    if (!hasAnyPlan) return ''

    const palette = selectedStyle.palette
    const finalPrimary = primary || palette.primary || ''
    const finalBackground = background || palette.background || ''
    const finalAccent = accent || palette.accent || ''

    const lines: string[] = []

    const base = kind === 'cover' ? buildCoverBasePromptLines(ratio) : buildIllustrationBasePromptLines(ratio)
    lines.push(...base)
    lines.push('')

    // Prompt format follows baoyu skill reference templates (article illustrator + cover image).
    if (kind === 'cover') {
      lines.push(`Cover theme: ${theme || ''}`.trimEnd())
      lines.push(`Style: ${selectedStyle.name}`)
      lines.push(`Aspect ratio: ${ratio}`)
      lines.push('')

      if (coverTitleEnabled) {
        lines.push('Title text: ' + (coverTitleText || ''))
        lines.push('Subtitle: ' + (coverSubtitleText || ''))
      } else {
        lines.push('Note: No title text, pure visual illustration only. Do NOT include any text, letters, logos, watermarks, or brands.')
      }

      lines.push('')
    } else {
      if (theme) lines.push(`Illustration theme: ${theme}`)
      lines.push(`Style: ${selectedStyle.name}`)
      if (purpose) lines.push(`Purpose: ${purpose}`)
      if (position) lines.push(`Insert position: ${position}`)
      if (source) lines.push(`Article cue: ${source}`)
      lines.push('')
    }

    lines.push('Visual composition:')
    lines.push(`- Main visual: ${main || ''}`.trimEnd())
    lines.push(`- Layout: ${layout || ''}`.trimEnd())
    lines.push(`- Decorative elements: ${decor || ''}`.trimEnd())

    lines.push('')
    lines.push('Color scheme:')
    lines.push(`- Primary: ${finalPrimary || ''}`.trimEnd())
    lines.push(`- Background: ${finalBackground || ''}`.trimEnd())
    lines.push(`- Accent: ${finalAccent || ''}`.trimEnd())

    lines.push('')
    lines.push('Text content (if any):')
    if (kind === 'cover' && coverTitleEnabled) {
      lines.push(`- ${coverTitleText || ''}`.trimEnd())
      if (coverSubtitleText) lines.push(`- ${coverSubtitleText}`)
    } else if (textContent.length) {
      textContent.forEach(t => lines.push(`- ${t}`))
    } else if (kind === 'cover' && !coverTitleEnabled) {
      lines.push('- None (no text)')
    } else {
      lines.push('- None')
    }

    lines.push('')
    if (lighting) lines.push(`Lighting / mood / camera: ${lighting}`)
    lines.push(`Style notes: ${styleNotes || ''}`.trimEnd())
    lines.push(`Style keypoints: ${buildStylePrompt(selectedStyle)}`)

    return lines.join('\n').trim()
  }

  const extractBlocks = async () => {
    const textConfig = getActiveConfig('text')
    if (!textConfig) {
      showToast('请先在设置中配置文案生成渠道', 'warning')
      navigate('/settings')
      return
    }
    if (!textConfig.textModel) {
      showToast('请先在设置中填写文案渠道的文本模型', 'warning')
      navigate('/settings')
      return
    }

    if (!article.trim()) {
      showToast('请先粘贴文章或上传文件', 'warning')
      return
    }

    setExtracting(true)
    setBlocks([])

    const systemPrompt = buildPlannerSystemPrompt({
      totalCount,
      ratio,
      includeCover,
      coverTitleEnabled,
      style: selectedStyle
    })

    const userPrompt = `文章：\n${article}`


    try {
      const rawContent = await requestTextGeneration(textConfig, { systemPrompt, userPrompt })
      const parsed = parseJsonFromContent(rawContent)
      const list = normalizeModelBlocks(parsed)

      if (!Array.isArray(list) || list.length === 0) throw new Error('返回格式不正确：未找到 blocks 数组')

      const normalized: IllustrationBlock[] = list.slice(0, totalCount).map((item: any, i: number) => {
        const kind: IllustrationBlock['kind'] = includeCover && i === 0 ? 'cover' : 'content'

        const title = toOneLine(item?.title)
        const source = toOneLine(item?.source)

        const promptFromLines = Array.isArray(item?.promptLines)
          ? item.promptLines.filter((v: any) => typeof v === 'string').join('\n').trim()
          : ''
        const promptFromString = typeof item?.prompt === 'string' ? item.prompt.trim() : ''
        const promptFromPlan = buildPromptFromPlan(item, kind)

        const prompt = (promptFromLines || promptFromString || promptFromPlan).trim()

        return {
          id: `ai_${Date.now()}_${i}`,
          kind,
          title: title || (kind === 'cover' ? '封面配图' : `配图 ${includeCover ? i : i + 1}`),
          source,
          prompt
        }
      })

      gallerySessionRef.current = null
      gallerySessionPromiseRef.current = null
      setBlocks(normalized)
      collapseConfigOnMobile()
      showToast('已生成配图信息', 'success')
    } catch (e: any) {
      showToast(`生成失败: ${e?.message || '未知错误'}`, 'error')
    } finally {
      setExtracting(false)
    }
  }

  const generateImage = async (index: number) => {
    const config = getActiveConfig()
    if (!config) {
      showToast('请先在设置中配置绘图 API 渠道', 'warning')
      navigate('/settings')
      return
    }
    if (!config.imageModel) {
      showToast('请先在设置中填写绘图模型', 'warning')
      navigate('/settings')
      return
    }

    const block = blocks[index]
    if (!block) return

    const prompt = block.prompt?.trim()
    if (!prompt) {
      showToast('提示词为空', 'warning')
      return
    }

    setBlocks(prev => {
      const next = [...prev]
      next[index] = { ...next[index], imageData: 'loading' }
      return next
    })

    try {
      const imageData = await requestImageGeneration(config, {
        prompt,
        quality,
        ratio,
        enableModelSuffix: config.enableModelSuffix
      })

      setBlocks(prev => {
        const next = [...prev]
        next[index] = { ...next[index], imageData }
        return next
      })
      try {
        await saveGeneratedImage(prompt, imageData)
        showToast('图片生成成功，已保存到作品管理', 'success')
      } catch (err) {
        console.error('Failed to save generated image:', err)
        showToast('图片生成成功，但保存到作品管理失败', 'warning')
      }
    } catch (e: any) {
      setBlocks(prev => {
        const next = [...prev]
        next[index] = { ...next[index], imageData: undefined }
        return next
      })
      showToast(`生成失败: ${e?.message || '未知错误'}`, 'error')
    }
  }

  const generateAllImages = async () => {
    if (blocks.length === 0) return
    for (let i = 0; i < blocks.length; i++) {
      await generateImage(i)
    }
  }

  const copyPrompt = async (index: number) => {
    const block = blocks[index]
    if (!block?.prompt) return
    await navigator.clipboard.writeText(block.prompt)
    showToast('已复制提示词', 'success')
  }

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full flex flex-col">
        <div className="px-4 py-4 border-b border-[var(--border-color)] bg-[var(--bg-primary)] lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight truncate">文章配图</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsConfigOpen(open => !open)}
                aria-expanded={isConfigOpen}
                aria-controls="article-config-panel"
                className="px-2.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isConfigOpen ? '收起输入' : '展开输入'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Input & Config */}
          <div
            id="article-config-panel"
            className={[
              'lg:w-[420px] p-4 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] overflow-y-auto lg:block',
              isConfigOpen ? 'block' : 'hidden'
            ].join(' ')}
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">文章输入</label>
                <button
                  onClick={() => articleFileRef.current?.click()}
                  className="text-xs text-[var(--link-color)] hover:underline"
                >
                  上传文件
                </button>
              </div>
              <textarea
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                placeholder="粘贴文章内容，或点击右上角上传文件..."
                className="w-full px-3 py-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] h-32 resize-none shadow-sm font-serif"
              />
              <input
                ref={articleFileRef}
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                className="hidden"
                onChange={(e) => handleArticleFile(e.target.files)}
              />
              <button
                onClick={extractBlocks}
                disabled={extracting}
                className="w-full mt-2 px-4 py-2.5 bg-[var(--accent-color)] text-white rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {extracting ? (
                  <>
                    <div className="loading-spinner w-4 h-4" />
                    提取中...
                  </>
                ) : (
                  '提取配图信息'
                )}
              </button>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-3 shadow-sm mb-3">
              <div className="text-sm font-medium mb-2">配置</div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeCover}
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  封面配图
                </label>
                <div className="text-xs text-[var(--text-tertiary)]">共 {totalCount} 张</div>
              </div>
              {includeCover && (
                <label className="flex items-center justify-between gap-2 text-sm cursor-pointer select-none mb-2">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={coverTitleEnabled}
                      onChange={(e) => setCoverTitleEnabled(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    封面含标题（{'<=8字'}）
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] font-serif">手写字体</span>
                </label>
              )}

              <label className="block text-sm mb-0.5">正文配图数量</label>
              <select
                value={bodyCount}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'auto') setBodyCount('auto')
                  else setBodyCount(Number(v) as BodyCountOption)
                }}
                className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
              >
                <option value="auto">自动（推荐 {autoBodyCount} 张）</option>
                <option value={1}>1 张</option>
                {[2, 3, 4, 6, 8, 10].map(n => (
                  <option key={n} value={n}>{n} 张</option>
                ))}
              </select>

              <details className="mt-2">
                <summary className="text-sm cursor-pointer select-none text-[var(--text-secondary)]">高级生成参数</summary>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-0.5">分辨率</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
                    >
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-tertiary)] mb-0.5">比例</label>
                    <select
                      value={ratio}
                      onChange={(e) => setRatio(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
                    >
                      <option value="2.35:1">2.35:1</option>
                      <option value="3:4">3:4</option>
                      <option value="1:1">1:1</option>
                      <option value="4:3">4:3</option>
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                    </select>
                  </div>
                </div>
              </details>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">配图风格</div>
                <div className="text-xs text-[var(--text-tertiary)]">点击选择，预览看大图</div>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm mb-3">
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {styleId === 'auto' ? `自动（推荐：${autoStyle.name}）` : selectedStyle.name}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] font-serif mt-1">{selectedStyle.desc}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)] font-serif mt-1 line-clamp-2">{selectedStyle.bestFor}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLightbox(selectedStyle.previewBg)}
                      className="shrink-0 px-2.5 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      预览
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setStyleId('auto')}
                    className={[
                      'text-left rounded-2xl border bg-[var(--bg-primary)] p-2 shadow-sm transition-colors',
                      styleId === 'auto' ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]' : 'border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'
                    ].join(' ')}
                  >
                    <div className="rounded-xl overflow-hidden bg-[var(--bg-tertiary)]" style={{ aspectRatio: '16 / 9' }}>
                      <img src={autoStyle.previewBg} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="mt-2 text-xs font-medium truncate">自动</div>
                    <div className="text-[11px] text-[var(--text-tertiary)] truncate font-serif">推荐：{autoStyle.name}</div>
                  </button>
                  {STYLE_PRESETS.map(style => {
                    const active = style.id === styleId
                    return (
                      <button
                        key={style.id}
                        onClick={() => setStyleId(style.id)}
                        className={[
                          'text-left rounded-2xl border bg-[var(--bg-primary)] p-2 shadow-sm transition-colors',
                          active ? 'border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]' : 'border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'
                        ].join(' ')}
                      >
                        <div className="rounded-xl overflow-hidden bg-[var(--bg-tertiary)]" style={{ aspectRatio: '16 / 9' }}>
                          <img src={style.previewBg} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-2 text-xs font-medium truncate">{style.name}</div>
                        <div className="text-[11px] text-[var(--text-tertiary)] truncate font-serif">{style.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Blocks */}
          <div className="flex-1 p-4 overflow-y-auto">
            {blocks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
                在左侧粘贴文章，然后点击“提取配图信息”
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-[var(--text-secondary)]">
                    已生成 {blocks.length} 个信息块，可编辑提示词后生成图片
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={generateAllImages}
                      className="px-3 py-2 rounded-xl bg-[var(--success-color)] text-white text-sm shadow-sm hover:opacity-90 transition-opacity"
                    >
                      批量生成图片
                    </button>
                    <button
                      onClick={() => {
                        const all = blocks.map(b => b.prompt).filter(Boolean).join('\n\n')
                        navigator.clipboard.writeText(all).then(() => showToast('已复制全部提示词', 'success'))
                      }}
                      className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      复制全部提示词
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {(() => {
                    let contentNo = 0
                    return blocks.map((block, i) => {
                      const displayNo = block.kind === 'content' ? ++contentNo : 0
                      return (
                        <div
                          key={block.id}
                          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm"
                        >
                      <div className="p-4 border-b border-[var(--border-color)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {block.kind === 'cover' ? `封面 · ${block.title}` : `${displayNo}. ${block.title}`}
                            </div>
                            {block.source && (
                              <div className="text-xs text-[var(--text-tertiary)] font-serif mt-1 line-clamp-2">
                                {block.source}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs shrink-0">
                            <button
                              onClick={() => copyPrompt(i)}
                              className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                              复制
                            </button>
                            <button
                              onClick={() => generateImage(i)}
                              className="px-2.5 py-1.5 rounded-xl bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                            >
                              {block.imageData && block.imageData !== 'loading' ? '重生成' : '生图'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        <textarea
                          value={block.prompt}
                          onChange={(e) => {
                            const v = e.target.value
                            setBlocks(prev => {
                              const next = [...prev]
                              next[i] = { ...next[i], prompt: v }
                              return next
                            })
                          }}
                          placeholder="可编辑提示词..."
                          className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm h-28 resize-none font-serif"
                        />

                        <div
                          className="relative w-full min-h-[220px] lg:min-h-0 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl overflow-hidden"
                          style={{ aspectRatio: toAspect(ratio) }}
                        >
                          {block.imageData && block.imageData !== 'loading' && (
                            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                              <button
                                onClick={() => downloadImage(block.imageData!, `article_${Date.now()}_${i}.png`)}
                                className="px-2.5 py-1.5 rounded-full bg-[rgba(20,20,19,0.55)] text-white text-xs border border-white/15 backdrop-blur-sm hover:bg-[rgba(20,20,19,0.72)] transition-colors shadow-sm"
                              >
                                下载
                              </button>
                              <button
                                onClick={() => {
                                  useAppStore.getState().openSlicerModal(block.imageData!)
                                  navigate('/editor')
                                }}
                                className="px-2.5 py-1.5 rounded-full bg-[rgba(20,20,19,0.55)] text-white text-xs border border-white/15 backdrop-blur-sm hover:bg-[rgba(20,20,19,0.72)] transition-colors shadow-sm"
                              >
                                去切片
                              </button>
                            </div>
                          )}
                          {block.imageData === 'loading' ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="loading-spinner w-8 h-8" />
                            </div>
                          ) : block.imageData ? (
                            <img
                              src={block.imageData}
                              alt=""
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => openLightbox(block.imageData!)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-tertiary)]">
                              暂无图片，可点击“生图”
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
