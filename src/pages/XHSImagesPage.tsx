import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { downloadImage } from '../utils/helpers'
import { normalizeModelBlocks, requestImageGeneration, requestTextGeneration } from '../services/image-generation'
import { usePageHeader } from '../components/layout/PageHeaderContext'

import {
  XHS_STYLE_PRESETS,
  XHS_LAYOUT_PRESETS,
  XHS_STYLE_KEYWORDS,
  matchBestStyleId,
  type ArticleStylePreset,
  type XHSIllustrationBlock,
  type BodyCountOption,
  type XHSLayoutPreset,
  type XHSLayoutPresetId
} from '@/config/image-generation'
import { parseJsonFromContent, toOneLine, asPlainObject, inferOrientation, toAspect } from '@/utils/prompt-helpers'

type StylePreset = ArticleStylePreset
type IllustrationBlock = XHSIllustrationBlock
type LayoutPreset = XHSLayoutPreset

const STYLE_PRESETS = XHS_STYLE_PRESETS
const LAYOUT_PRESETS = XHS_LAYOUT_PRESETS

export default function XHSImagesPage() {
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
      title: 'XHS配图',
      description: '将内容拆解为小红书可滑动信息图系列，生成可直接生图的提示词',
      actions: headerActions
    })
    return () => setHeader(null)
  }, [setHeader, headerActions])

  const [article, setArticle] = useState('')
  const [includeCover, setIncludeCover] = useState(true)
  const [includeEnding, setIncludeEnding] = useState(true)
  const [bodyCount, setBodyCount] = useState<BodyCountOption>('auto')
  const [styleId, setStyleId] = useState<'auto' | string>('auto')
  const [layoutId, setLayoutId] = useState<'auto' | string>('auto')
  const [quality, setQuality] = useState<'1K' | '2K' | '4K'>('2K')
  const [ratio, setRatio] = useState<'2.35:1' | '3:4' | '1:1' | '4:3' | '16:9' | '9:16'>('16:9')
  const [isConfigOpen, setIsConfigOpen] = useState(true)

  const [blocks, setBlocks] = useState<IllustrationBlock[]>([])
  const [extracting, setExtracting] = useState(false)

  const articleFileRef = useRef<HTMLInputElement>(null)
  const gallerySessionRef = useRef<number | null>(null)
  const gallerySessionPromiseRef = useRef<Promise<number> | null>(null)

  const buildGallerySessionTitle = () => {
    const fallback = 'XHS配图'
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

  const autoStyleId = useMemo(
    () => matchBestStyleId(article, XHS_STYLE_KEYWORDS, 'cute'),
    [article]
  )

  const autoStyle = useMemo(() => {
    return STYLE_PRESETS.find(s => s.id === autoStyleId) || STYLE_PRESETS.find(s => s.id === 'cute') || STYLE_PRESETS[0]
  }, [autoStyleId])

  const selectedStyle = useMemo(() => {
    const effectiveId = styleId === 'auto' ? autoStyleId : styleId
    return STYLE_PRESETS.find(s => s.id === effectiveId) || STYLE_PRESETS.find(s => s.id === 'cute') || STYLE_PRESETS[0]
  }, [styleId, autoStyleId])

  const autoLayoutId = useMemo<XHSLayoutPresetId>(() => {
    const text = article.trim().toLowerCase()
    if (!text) return 'balanced'

    const hasSteps = /(步骤|step\s*\d|\d+\s*[\.、]\s*|流程)/i.test(text)
    const hasVs = /(vs|对比|比较|优缺点|差异)/i.test(text)
    const hasList = /(top\s*\d|清单|列表|排名|工具|推荐|必备)/i.test(text)
    const len = text.replace(/\s+/g, '').length

    if (hasVs) return 'comparison'
    if (hasSteps) return 'flow'
    if (hasList) return len > 1500 ? 'dense' : 'list'
    if (len > 3000) return 'dense'
    return 'balanced'
  }, [article])

  const autoLayout = useMemo(() => {
    return LAYOUT_PRESETS.find(l => l.id === autoLayoutId) || LAYOUT_PRESETS[1]
  }, [autoLayoutId])

  const selectedLayout = useMemo(() => {
    const effectiveId = layoutId === 'auto' ? autoLayoutId : layoutId
    return LAYOUT_PRESETS.find(l => l.id === effectiveId) || LAYOUT_PRESETS[1]
  }, [layoutId, autoLayoutId])

  const totalCount = useMemo(
    () => (includeCover ? 1 : 0) + resolvedBodyCount + (includeEnding ? 1 : 0),
    [includeCover, resolvedBodyCount, includeEnding]
  )

  const handleArticleFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      setArticle(text)
      showToast('已载入文本文件', 'success')
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

  const buildXhsBasePromptLines = (r: string) => {
    const orientation = inferOrientation(r)
    return [
      'Create a Xiaohongshu (Little Red Book) style infographic following these guidelines:',
      '',
      '## Image Specifications',
      '',
      '- Type: Infographic',
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
      '',
      '## Text Style (CRITICAL)',
      '',
      '- ALL text MUST be hand-drawn style',
      '- Main titles should be prominent and eye-catching',
      '- Key text should be bold and enlarged',
      '- Use highlighter effects to emphasize keywords',
      '- DO NOT use realistic or computer-generated fonts',
      '',
      '## Language',
      '',
      '- Use the same language as the content provided below',
      '- Match punctuation style to the content language (Chinese: \"\"，。！)',
      '',
      '---',
      '',
      'Please use nano banana pro to generate the infographic based on the content provided below:'
    ]
  }

  const buildPlannerSystemPrompt = (params: {
    totalCount: number
    ratio: string
    includeCover: boolean
    includeEnding: boolean
    layout: LayoutPreset
    style: StylePreset
  }) => {
    const { totalCount, ratio, includeCover, includeEnding, layout, style } = params

    const lines: string[] = []

    lines.push('你是一位资深的小红书（XHS / RedNote）信息图策划与提示词工程师。你的产出将直接作为绘图模型（nano banana pro）的输入提示词。')
    lines.push('请把用户提供的内容拆成可滑动阅读的图文信息图系列（Carousel）。')
    lines.push('目标：信息层级清晰、留白充分、关键词高亮、文字手写可读。')
    lines.push('')
    lines.push('你需要在脑中完成这些步骤（不要输出步骤文本）：')
    lines.push('1) 提炼内容主题、受众、痛点/收益点')
    lines.push('2) 设计滑动节奏：Cover Hook -> Content Value -> Ending CTA')
    lines.push('3) 每张图只讲 1 个核心信息点；把文字内容写成标题/副标题/要点')
    lines.push('4) 把每张图拆成可执行的视觉指令：布局分区、图标/插画、层级、留白、配色、高亮')
    lines.push('5) 生成最终可用提示词（promptLines）时，严格遵循 Base Prompt：手绘信息图、手写字体、高亮关键词')
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
    lines.push('系列结构：')
    lines.push(includeCover
      ? '- 第 1 张必须是 cover（封面页）：Hook + 强视觉冲击；信息稀疏但抓眼。'
      : '- 本次不需要 cover。'
    )
    lines.push(includeEnding
      ? '- 最后 1 张必须是 ending（结尾页）：总结 + CTA + 互动引导（收藏/评论/关注）。'
      : '- 本次不需要 ending。'
    )
    lines.push('- 其余为 content（内容页）：每页只讲 1 个核心价值点，用明确分区/列表/流程承载信息。')
    lines.push(`- default_layout: ${layout.id}（${layout.name}）`)
    lines.push(`- layout_keypoints: ${layout.keyPoints.join('、')}`)
    lines.push('')
    lines.push('输出要求（非常重要）：')
    lines.push('- 只输出严格 JSON（不要 markdown，不要解释，不要多余文本）。')
    lines.push(`- 直接输出 JSON 数组，长度必须为 ${totalCount}。`)
    lines.push('- blocks 之间不要重复同一个信息点；按滑动节奏递进（cover -> content -> ending）。')
    lines.push('- JSON 安全：所有字符串字段必须是单行；不要在任何字符串里出现未转义的英文双引号字符(\")。')
    lines.push('- promptLines 必须是 string 数组；每个元素是一行提示词；最终会用 \\n 拼接成生图 prompt。')
    lines.push('')
    lines.push('Base Prompt 模板（promptLines 需要复制其思想与结构；允许根据 aspect_ratio 调整 Orientation/Aspect Ratio 行）：')
    buildXhsBasePromptLines(ratio).forEach(l => lines.push(l))
    lines.push('')
    lines.push('PromptLines 写法（非常重要）：')
    lines.push('- 每个 block 的 promptLines 必须先完整包含 Base Prompt（逐行），然后再追加下方结构化信息。')
    lines.push('- 追加信息建议按顺序：Page/Layout/Style/Aspect ratio -> Hook/Core message -> Text content -> Visual concept -> Swipe hook -> Color palette -> Style notes。')
    lines.push('- 所有要出现在画面里的文字，都必须是手写风格，且可读；标题更大，关键词用荧光笔/marker 高亮。')
    lines.push('- 为了 JSON 安全：promptLines 的任何一行都不要出现英文双引号 \";需要引用时请用中文引号「」或『』。')
    lines.push('')
    lines.push('【PromptLines 模板 - Cover】')
    lines.push('XHS Carousel Page: Cover')
    lines.push('Layout: sparse')
    lines.push(`Style: ${style.name}`)
    lines.push(`Aspect ratio: ${ratio}`)
    lines.push('Hook: <hook>')
    lines.push('Core message: <coreMessage>')
    lines.push('Text content (hand-drawn):')
    lines.push('- Title: <text.title>')
    lines.push('- Subtitle: <text.subtitle>')
    lines.push('Visual concept: <visualConcept>')
    lines.push('Swipe hook: <text.swipeHook>')
    lines.push('Color palette: primary <primary>; background <background>; accent <accent>')
    lines.push('Style notes: <styleNotes>')
    lines.push('')
    lines.push('【PromptLines 模板 - Content / Ending】')
    lines.push('XHS Carousel Page: Content or Ending')
    lines.push(`Layout: ${layout.id} (or override per page)`)
    lines.push(`Style: ${style.name}`)
    lines.push(`Aspect ratio: ${ratio}`)
    lines.push('Core message: <coreMessage>')
    lines.push('Text content (hand-drawn):')
    lines.push('- Title: <text.title>')
    lines.push('- Subtitle: <text.subtitle>')
    lines.push('- Points: <text.points[]> (short, one line each)')
    lines.push('- CTA (ending only): <text.cta>')
    lines.push('- Interaction (ending only): <text.interaction>')
    lines.push('Visual concept: <visualConcept>')
    lines.push('Swipe hook: <text.swipeHook>')
    lines.push('Color palette: primary <primary>; background <background>; accent <accent>')
    lines.push('Style notes: <styleNotes>')
    lines.push('')
    lines.push('每个 block 的格式如下（字段必须齐全；字符串字段若无内容请输出空字符串 \"\"；数组字段若无内容请输出空数组 []）：')
    lines.push('{')
    lines.push('  \"title\": \"该页标题（<=12字）\",')
    lines.push('  \"kind\": \"cover|content|ending\",')
    lines.push('  \"layout\": \"sparse|balanced|dense|list|comparison|flow\",')
    lines.push('  \"hook\": \"仅cover：开头钩子/情绪句（单行）\",')
    lines.push('  \"coreMessage\": \"本页核心信息（单行）\",')
    lines.push('  \"source\": \"来自内容的关键词/短句（<=40字）\",')
    lines.push('  \"text\": {')
    lines.push('    \"title\": \"画面主标题（单行）\",')
    lines.push('    \"subtitle\": \"副标题（单行）\",')
    lines.push('    \"points\": [\"要点列表（每行一个，单行）\"],')
    lines.push('    \"cta\": \"结尾CTA（单行）\",')
    lines.push('    \"interaction\": \"互动引导（单行）\",')
    lines.push('    \"swipeHook\": \"引导下一张的钩子（单行）\"')
    lines.push('  },')
    lines.push('  \"visualConcept\": \"画面视觉概念（单行，说明分区/图标/插画元素）\",')
    lines.push('  \"styleNotes\": \"补充风格特征（可选，单行）\",')
    lines.push('  \"promptLines\": [\"最终生图提示词（必须按 Base Prompt + Prompt Format 写好）\"]')
    lines.push('}')

    return lines.join('\n').trim()
  }

  const buildPromptFromPlan = (item: any, kind: IllustrationBlock['kind']) => {
    const title = toOneLine(item?.title)
    const source = toOneLine(item?.source)

    const hook = toOneLine(item?.hook)
    const coreMessage = toOneLine(item?.coreMessage ?? item?.core_message ?? item?.core ?? item?.message)

    const text = asPlainObject(item?.text) || {}
    const textTitle = toOneLine(text.title ?? item?.textTitle ?? item?.text_title)
    const subtitle = toOneLine(text.subtitle ?? item?.subtitle)

    const pointsRaw = text.points ?? item?.points
    const points = Array.isArray(pointsRaw)
      ? pointsRaw.map(v => toOneLine(v)).filter(Boolean)
      : toOneLine(pointsRaw)
        ? [toOneLine(pointsRaw)]
        : []

    const cta = toOneLine(text.cta ?? item?.cta)
    const interaction = toOneLine(text.interaction ?? item?.interaction)
    const swipeHook = toOneLine(text.swipeHook ?? text.swipe_hook ?? item?.swipeHook ?? item?.swipe_hook)

    const visualConcept = toOneLine(item?.visualConcept ?? item?.visual_concept ?? item?.visual)
    const styleNotes = toOneLine(item?.styleNotes ?? item?.style_notes)

    const layoutCandidate = toOneLine(item?.layout)
    const allowedLayouts: LayoutPreset['id'][] = ['sparse', 'balanced', 'dense', 'list', 'comparison', 'flow']
    const layoutId: LayoutPreset['id'] =
      allowedLayouts.includes(layoutCandidate as LayoutPreset['id'])
        ? (layoutCandidate as LayoutPreset['id'])
        : (kind === 'cover' || kind === 'ending')
          ? 'sparse'
          : selectedLayout.id

    const layoutPreset = LAYOUT_PRESETS.find(l => l.id === layoutId)

    const hasAnyPlan =
      title ||
      source ||
      hook ||
      coreMessage ||
      textTitle ||
      subtitle ||
      points.length ||
      cta ||
      interaction ||
      swipeHook ||
      visualConcept ||
      styleNotes
    if (!hasAnyPlan) return ''

    const palette = selectedStyle.palette

    const lines: string[] = []
    lines.push(...buildXhsBasePromptLines(ratio))
    lines.push('')

    lines.push(`XHS Carousel Page: ${kind}`)
    lines.push(`Layout: ${layoutPreset ? `${layoutPreset.id} (${layoutPreset.name})` : layoutId}`)
    lines.push(`Style: ${selectedStyle.name}`)
    lines.push(`Aspect ratio: ${ratio}`)
    lines.push('')

    if (kind === 'cover') {
      lines.push('Cover rule: sparse layout, strong visual center, big readable title, 1 core hook only.')
      if (hook) lines.push(`Hook: ${hook}`)
    } else if (kind === 'ending') {
      lines.push('Ending rule: short summary + clear CTA + interaction (collect/comment/follow). Use icons.')
    }

    if (coreMessage) lines.push(`Core message: ${coreMessage}`)
    if (source) lines.push(`Source cue: ${source}`)
    if (swipeHook) lines.push(`Swipe hook: ${swipeHook}`)

    lines.push('')
    lines.push('Text content (hand-drawn):')
    if (textTitle) lines.push(`- Title: ${textTitle}`)
    if (subtitle) lines.push(`- Subtitle: ${subtitle}`)
    if (points.length) {
      lines.push('- Points:')
      points.forEach(p => lines.push(`- ${p}`))
    } else {
      lines.push('- Points: None')
    }
    if (cta) lines.push(`- CTA: ${cta}`)
    if (interaction) lines.push(`- Interaction: ${interaction}`)

    lines.push('')
    lines.push('Visual concept:')
    if (visualConcept) lines.push(`- ${visualConcept}`)
    if (layoutPreset?.keyPoints?.length) lines.push(`- Layout keypoints: ${layoutPreset.keyPoints.join(', ')}`)

    lines.push('')
    lines.push('Color palette:')
    lines.push(`- Primary: ${palette.primary}`)
    lines.push(`- Background: ${palette.background}`)
    lines.push(`- Accent: ${palette.accent}`)

    lines.push('')
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
      showToast('请先粘贴内容或上传文件', 'warning')
      return
    }

    setExtracting(true)
    setBlocks([])

    const systemPrompt = buildPlannerSystemPrompt({
      totalCount,
      ratio,
      includeCover,
      includeEnding,
      layout: selectedLayout,
      style: selectedStyle
    })

    const userPrompt = `内容：\n${article}`


    try {
      const rawContent = await requestTextGeneration(textConfig, { systemPrompt, userPrompt })
      const parsed = parseJsonFromContent(rawContent)
      const list = normalizeModelBlocks(parsed)

      if (!Array.isArray(list) || list.length === 0) throw new Error('返回格式不正确：未找到 blocks 数组')

      const normalized: IllustrationBlock[] = list.slice(0, totalCount).map((item: any, i: number) => {
        const kind: IllustrationBlock['kind'] =
          includeCover && i === 0
            ? 'cover'
            : includeEnding && i === totalCount - 1
              ? 'ending'
              : 'content'

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
          title: title || (kind === 'cover' ? '封面' : kind === 'ending' ? '结尾/CTA' : `内容 ${includeCover ? i : i + 1}`),
          source,
          prompt
        }
      })

      gallerySessionRef.current = null
      gallerySessionPromiseRef.current = null
      setBlocks(normalized)
      collapseConfigOnMobile()
      showToast('已生成配图大纲与提示词', 'success')
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
              <h1 className="text-lg font-semibold tracking-tight truncate">XHS配图</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsConfigOpen(open => !open)}
                aria-expanded={isConfigOpen}
                aria-controls="xhs-config-panel"
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
            id="xhs-config-panel"
            className={[
              'lg:w-[420px] p-4 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] overflow-y-auto lg:block',
              isConfigOpen ? 'block' : 'hidden'
            ].join(' ')}
          >
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">内容输入</label>
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
                placeholder="粘贴小红书笔记/文章内容，或点击右上角上传文件..."
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
                    生成中...
                  </>
                ) : (
                  '生成系列大纲'
                )}
              </button>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-3 shadow-sm mb-3">
              <div className="text-sm font-medium mb-2">配置</div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeCover}
                      onChange={(e) => setIncludeCover(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    封面页
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeEnding}
                      onChange={(e) => setIncludeEnding(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    结尾/CTA页
                  </label>
                </div>
                <div className="text-xs text-[var(--text-tertiary)]">共 {totalCount} 张</div>
              </div>

              <label className="block text-sm mb-0.5">中间内容页数量</label>
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

              <label className="block text-sm mb-0.5 mt-2">默认信息布局</label>
              <select
                value={layoutId}
                onChange={(e) => setLayoutId(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm shadow-sm"
              >
                <option value="auto">自动（推荐 {autoLayout.name}）</option>
                {LAYOUT_PRESETS.map(layout => (
                  <option key={layout.id} value={layout.id}>{layout.name}</option>
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
                在左侧粘贴内容，然后点击“生成系列大纲”
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-[var(--text-secondary)]">
                    已生成 {blocks.length} 张卡片，可编辑提示词后生成图片
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
                              {block.kind === 'cover'
                                ? `封面 · ${block.title}`
                                : block.kind === 'ending'
                                  ? `结尾 · ${block.title}`
                                  : `${displayNo}. ${block.title}`}
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
