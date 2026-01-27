import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { buildDynamicImageModel, buildGeminiUrl, buildOpenAIUrl, downloadImage, nativeFetch } from '../utils/helpers'
import { usePageHeader } from '../components/layout/PageHeaderContext'
import {
  INFOGRAPHIC_STYLE_PRESETS,
  INFOGRAPHIC_LAYOUT_PRESETS,
  INFOGRAPHIC_STYLE_KEYWORDS,
  matchBestStyleId,
  type InfographicStylePreset,
  type InfographicBlock,
  type InfographicSection,
  type LayoutPreset
} from '@/config/image-generation'
import { parseJsonFromContent, toOneLine, asPlainObject, toStringArray, inferOrientation, toAspect } from '@/utils/prompt-helpers'

const STYLE_PRESETS = INFOGRAPHIC_STYLE_PRESETS
const LAYOUT_PRESETS = INFOGRAPHIC_LAYOUT_PRESETS

export default function InfographicPage() {
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
      title: '信息图',
      description: '将内容整理成单页高密度信息图，生成可直接生图的提示词',
      actions: headerActions
    })
    return () => setHeader(null)
  }, [setHeader, headerActions])

  const [article, setArticle] = useState('')
  const [styleId, setStyleId] = useState<'auto' | string>('auto')
  const [layoutId, setLayoutId] = useState<'auto' | string>('auto')
  const [quality, setQuality] = useState<'1K' | '2K' | '4K'>('2K')
  const [ratio, setRatio] = useState<'2.35:1' | '3:4' | '1:1' | '4:3' | '16:9' | '9:16'>('9:16')
  const [isConfigOpen, setIsConfigOpen] = useState(true)

  const [blocks, setBlocks] = useState<InfographicBlock[]>([])
  const [extracting, setExtracting] = useState(false)

  const articleFileRef = useRef<HTMLInputElement>(null)
  const gallerySessionRef = useRef<number | null>(null)
  const gallerySessionPromiseRef = useRef<Promise<number> | null>(null)

  const buildGallerySessionTitle = () => {
    const fallback = '信息图'
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

  const autoStyleId = useMemo(
    () => matchBestStyleId(article, INFOGRAPHIC_STYLE_KEYWORDS, 'craft-handmade'),
    [article]
  )

  const autoStyle = useMemo(() => {
    return STYLE_PRESETS.find(s => s.id === autoStyleId) || STYLE_PRESETS[0]
  }, [autoStyleId])

  const selectedStyle = useMemo(() => {
    const effectiveId = styleId === 'auto' ? autoStyleId : styleId
    return STYLE_PRESETS.find(s => s.id === effectiveId) || STYLE_PRESETS[0]
  }, [styleId, autoStyleId])

  const autoLayoutId = useMemo(() => {
    const text = article.trim().toLowerCase()
    if (!text) return 'bento-grid'

    const hasTimeline = /(时间线|timeline|历史|阶段|步骤|step|流程|过程)/i.test(text)
    const hasComparison = /(vs|对比|比较|优缺点|差异|区别)/i.test(text)
    const hasHierarchy = /(层级|金字塔|优先级|等级|级别|马斯洛)/i.test(text)
    const hasFunnel = /(漏斗|转化|筛选|销售|用户)/i.test(text)
    const hasCycle = /(循环|周期|闭环|生命周期|迭代)/i.test(text)
    const hasRoadmap = /(路线图|规划|里程碑|发展|路径)/i.test(text)
    const hasVenn = /(交集|重叠|关系|共同|韦恩)/i.test(text)

    if (hasTimeline) return 'linear-progression'
    if (hasComparison) return 'binary-comparison'
    if (hasHierarchy) return 'hierarchical-layers'
    if (hasFunnel) return 'funnel'
    if (hasCycle) return 'circular-flow'
    if (hasRoadmap) return 'winding-roadmap'
    if (hasVenn) return 'venn-diagram'

    return 'bento-grid'
  }, [article])

  const autoLayout = useMemo(() => {
    return LAYOUT_PRESETS.find(l => l.id === autoLayoutId) || LAYOUT_PRESETS[0]
  }, [autoLayoutId])

  const selectedLayout = useMemo(() => {
    const effectiveId = layoutId === 'auto' ? autoLayoutId : layoutId
    return LAYOUT_PRESETS.find(l => l.id === effectiveId) || LAYOUT_PRESETS[0]
  }, [layoutId, autoLayoutId])

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

  const buildStylePrompt = (style: InfographicStylePreset) => {
    return [
      `${style.name}（${style.tag}）`,
      `背景：${style.background}`,
      `视觉风格：${style.visual_style}`,
      `文字风格：${style.word_style}`,
      `内容原则：${style.content_principle}`,
      `留白规则：${style.negative_space}`
    ].join('；')
  }

  const buildInfographicBasePromptLines = (r: string) => {
    const orientation = inferOrientation(r)
    return [
      'Create a detailed, information-rich infographic following these guidelines:',
      '',
      '## Image Specifications',
      '',
      '- Type: Single-page infographic',
      `- Orientation: ${orientation}`,
      `- Aspect Ratio: ${r}`,
      '- Style: Follow the style preset notes provided below',
      '',
      '## Core Principles',
      '',
      '- Prioritize rich information density while keeping readability and hierarchy',
      '- Include ALL key points, steps, data values, and specialized terms from the content',
      '- Visualize information with icons, diagrams, charts, timelines, and labeled illustrations',
      '- Keep sections aligned with consistent spacing; avoid cluttered overlap',
      '- Avoid logos, watermarks, brand marks, and UI screenshots unless explicitly requested',
      '',
      '## Text Style (CRITICAL)',
      '',
      '- All text must follow the style preset (hand-drawn or specified typography)',
      '- Titles large and clear; subtitles and body text smaller but readable',
      '- Highlight keywords with markers, outlines, or color blocks when helpful',
      '',
      '## Language',
      '',
      '- Use the same language as the content provided below',
      '- Match punctuation style to the content language',
      '',
      '---',
      '',
      'Please use nano banana pro to generate the infographic based on the content provided below:'
    ]
  }

  const buildPlannerSystemPrompt = (params: {
    ratio: string
    style: InfographicStylePreset
    layout: LayoutPreset
  }) => {
    const { ratio, style, layout } = params

    const lines: string[] = []

    lines.push('你是一位资深的信息图策划 + 提示词工程师。你的产出将直接作为绘图模型（nano banana pro）的输入提示词。')
    lines.push('请把用户提供的内容整理成一张「高信息密度」的单页信息图。')
    lines.push('文字内容要更完整，图像内容要更具体：保留所有原始条目、流程、逻辑关系、数据和专业术语，不得捏造事实或数据。')
    lines.push('')
    lines.push('你需要在脑中完成这些步骤（不要输出步骤文本）：')
    lines.push('1) 提炼主题与层级结构，拆成 4-7 个信息模块（内容较少时可缩减）')
    lines.push('2) 每个模块输出标题 + 要点 + 数据/指标（若有）')
    lines.push('3) 设计主视觉 + 多种辅助视觉（图标、图表、流程、对比、标注）')
    lines.push('4) 规划画面分区、阅读路径、留白与对齐')
    lines.push('5) 生成最终 promptLines，遵循 Base Prompt 与结构化格式')
    lines.push('')
    lines.push('风格（全程一致）：')
    lines.push(`- style_id: ${style.id}`)
    lines.push(`- style_name: ${style.name}`)
    lines.push(`- style_tag: ${style.tag}`)
    lines.push(`- style_keypoints: ${buildStylePrompt(style)}`)
    lines.push('')
    lines.push('布局（信息架构）：')
    lines.push(`- layout_id: ${layout.id}`)
    lines.push(`- layout_name: ${layout.name}`)
    lines.push(`- layout_desc: ${layout.desc}`)
    lines.push(`- layout_bestFor: ${layout.bestFor}`)
    lines.push(`- layout_keyPoints: ${layout.keyPoints.join('、')}`)
    lines.push('')
    lines.push('画幅：')
    lines.push(`- aspect_ratio: ${ratio}`)
    lines.push('- 在构图字段里明确主体位置、留白与视觉动线（便于缩略图也能看懂）。')
    lines.push('')
    lines.push('输出要求（非常重要）：')
    lines.push('- 只输出严格 JSON（不要 markdown，不要解释，不要多余文本）。')
    lines.push('- 直接输出 JSON 数组，长度必须为 1。')
    lines.push('- JSON 安全：所有字符串字段必须是单行；不要在任何字符串里出现未转义的英文双引号字符(\")。')
    lines.push('- promptLines 必须是 string 数组；每个元素是一行提示词；最终会用 \\n 拼接成生图 prompt。')
    lines.push('')
    lines.push('Base Prompt 模板（promptLines 需要复制其思想与结构；允许根据 aspect_ratio 调整 Orientation/Aspect Ratio 行）：')
    buildInfographicBasePromptLines(ratio).forEach(l => lines.push(l))
    lines.push('')
    lines.push('PromptLines 写法（非常重要）：')
    lines.push('- promptLines 必须先完整包含 Base Prompt（逐行），然后再追加下方结构化信息。')
    lines.push('- 追加信息建议顺序：主题/风格/画幅 -> 布局结构 -> 文本内容 -> 数据与标注 -> 视觉元素 -> 风格参考/留白。')
    lines.push('- 所有要出现在画面里的文字，都必须可读且完整；标题更大，关键词高亮。')
    lines.push('- 为了 JSON 安全：promptLines 的任何一行都不要出现英文双引号 \";需要引用时请用中文引号「」或『』。')
    lines.push('')
    lines.push('【PromptLines 模板】')
    lines.push('Infographic theme: <theme>')
    lines.push(`Style: ${style.name}`)
    lines.push(`Aspect ratio: ${ratio}`)
    lines.push('Layout plan:')
    lines.push('- Overall structure: <layout>')
    lines.push('- Sections: <sectionSummary>')
    lines.push('Text content (hand-drawn, rich & complete):')
    lines.push('- Title: <text.title>')
    lines.push('- Subtitle: <text.subtitle>')
    lines.push('- Section 1: <heading> | Points: <points[]> | Data: <data[]>')
    lines.push('- Section 2: <heading> | Points: <points[]> | Data: <data[]>')
    lines.push('Data & labels:')
    lines.push('- <dataPoints[]>')
    lines.push('Visual elements:')
    lines.push('- Main illustration: <visuals.main>')
    lines.push('- Icons: <visuals.icons[]>')
    lines.push('- Charts/diagrams: <visuals.charts[]>')
    lines.push('- Callouts/annotations: <visuals.callouts[]>')
    lines.push('Style reference:')
    lines.push('- Background: <style.background>')
    lines.push('- Visual style: <style.visual_style>')
    lines.push('- Word style: <style.word_style>')
    lines.push('- Content principle: <style.content_principle>')
    lines.push('- Negative space: <style.negative_space>')
    lines.push('Style notes: <styleNotes>')
    lines.push('')
    lines.push('每个 block 的格式如下（字段必须齐全；字符串字段若无内容请输出空字符串 \"\"；数组字段若无内容请输出空数组 []）：')
    lines.push('{')
    lines.push('  \"title\": \"信息图标题（<=12字）\",')
    lines.push('  \"subtitle\": \"副标题（可选）\",')
    lines.push('  \"source\": \"来自内容的关键词/短句（<=40字）\",')
    lines.push('  \"theme\": \"信息图主题（2-4个词）\",')
    lines.push('  \"layout\": \"布局结构描述（单行）\",')
    lines.push('  \"sections\": [')
    lines.push('    {')
    lines.push('      \"heading\": \"模块标题（单行）\",')
    lines.push('      \"points\": [\"要点（单行）\"],')
    lines.push('      \"data\": [\"数据/指标（单行）\"]')
    lines.push('    }')
    lines.push('  ],')
    lines.push('  \"highlights\": [\"需要强调的关键词（单行）\"],')
    lines.push('  \"dataPoints\": [\"关键信息/数值/术语（单行）\"],')
    lines.push('  \"visuals\": {')
    lines.push('    \"main\": \"主视觉/场景/角色（单行）\",')
    lines.push('    \"icons\": [\"图标/元素（单行）\"],')
    lines.push('    \"charts\": [\"图表/流程/对比结构（单行）\"],')
    lines.push('    \"callouts\": [\"标注/提示/箭头说明（单行）\"]')
    lines.push('  },')
    lines.push('  \"styleNotes\": \"补充风格特征（可选，单行）\",')
    lines.push('  \"promptLines\": [\"最终生图提示词（必须按 Base Prompt + Prompt Format 写好）\"]')
    lines.push('}')

    return lines.join('\n').trim()
  }

  const buildPromptFromPlan = (item: any) => {
    const title = toOneLine(item?.title)
    const subtitle = toOneLine(item?.subtitle)
    const source = toOneLine(item?.source)
    const theme = toOneLine(item?.theme ?? item?.topic) || title
    const layout = toOneLine(item?.layout ?? item?.structure ?? item?.composition)
    const styleNotes = toOneLine(item?.styleNotes ?? item?.style_notes)

    const textContent = asPlainObject(item?.textContent ?? item?.text) || {}
    const textTitle = toOneLine(textContent.title) || title
    const textSubtitle = toOneLine(textContent.subtitle) || subtitle

    const sectionsRaw = Array.isArray(item?.sections) ? item.sections : Array.isArray(textContent.sections) ? textContent.sections : []
    const sections: InfographicSection[] = sectionsRaw
      .map((section: any): InfographicSection => {
        const sectionObj = asPlainObject(section) || {}
        const heading = toOneLine(sectionObj.heading ?? sectionObj.title ?? sectionObj.name)
        const points = toStringArray(sectionObj.points ?? sectionObj.items ?? sectionObj.bullets)
        const data = toStringArray(sectionObj.data ?? sectionObj.metrics ?? sectionObj.values)
        return { heading, points, data }
      })
      .filter((section: InfographicSection) => section.heading || section.points.length || section.data.length)

    const highlights = toStringArray(item?.highlights ?? item?.keywords ?? item?.keyPoints)
    const dataPoints = toStringArray(item?.dataPoints ?? item?.data_points ?? textContent.data ?? item?.data)

    const visuals = asPlainObject(item?.visuals ?? item?.visual) || {}
    const mainVisual = toOneLine(visuals.main ?? item?.mainVisual ?? item?.main)
    const icons = toStringArray(visuals.icons ?? item?.icons ?? item?.visualIcons)
    const charts = toStringArray(visuals.charts ?? item?.charts ?? item?.diagrams)
    const callouts = toStringArray(visuals.callouts ?? item?.callouts ?? item?.annotations)

    const hasAnyPlan = [
      title,
      subtitle,
      source,
      theme,
      layout,
      textTitle,
      textSubtitle,
      sections.length,
      highlights.length,
      dataPoints.length,
      mainVisual,
      icons.length,
      charts.length,
      callouts.length,
      styleNotes
    ].some(Boolean)
    if (!hasAnyPlan) return ''

    const lines: string[] = []

    lines.push(...buildInfographicBasePromptLines(ratio))
    lines.push('')
    lines.push(`Infographic theme: ${theme || ''}`.trimEnd())
    lines.push(`Style: ${selectedStyle.name}`)
    lines.push(`Aspect ratio: ${ratio}`)
    lines.push('')
    lines.push('Layout plan:')
    lines.push(`- Overall structure: ${layout || ''}`.trimEnd())
    if (sections.length) {
      const sectionSummary = sections.map((section: InfographicSection) => section.heading).filter(Boolean).join(' / ')
      if (sectionSummary) lines.push(`- Sections: ${sectionSummary}`)
    }
    if (source) lines.push(`- Source cue: ${source}`)
    lines.push('')
    lines.push('Text content (hand-drawn, rich & complete):')
    lines.push(`- Title: ${textTitle || ''}`.trimEnd())
    lines.push(`- Subtitle: ${textSubtitle || ''}`.trimEnd())
    if (sections.length) {
      sections.forEach((section: InfographicSection, index: number) => {
        const heading = section.heading ? `Section ${index + 1}: ${section.heading}` : `Section ${index + 1}`
        const pointsText = section.points.length ? `Points: ${section.points.join(' / ')}` : ''
        const dataText = section.data.length ? `Data: ${section.data.join(' / ')}` : ''
        const detail = [pointsText, dataText].filter(Boolean).join(' | ')
        lines.push(`- ${heading}${detail ? ` | ${detail}` : ''}`)
      })
    } else if (highlights.length) {
      lines.push(`- Key points: ${highlights.join(' / ')}`)
    }
    lines.push('')
    lines.push('Data & labels:')
    if (dataPoints.length) {
      dataPoints.forEach(point => lines.push(`- ${point}`))
    } else {
      lines.push('- None')
    }
    lines.push('')
    lines.push('Visual elements:')
    lines.push(`- Main illustration: ${mainVisual || ''}`.trimEnd())
    if (icons.length) lines.push(`- Icons: ${icons.join(' / ')}`)
    if (charts.length) lines.push(`- Charts/diagrams: ${charts.join(' / ')}`)
    if (callouts.length) lines.push(`- Callouts/annotations: ${callouts.join(' / ')}`)
    if (highlights.length) lines.push(`- Highlight keywords: ${highlights.join(' / ')}`)
    lines.push('')
    lines.push('Style reference:')
    lines.push(`- Background: ${selectedStyle.background}`)
    lines.push(`- Visual style: ${selectedStyle.visual_style}`)
    lines.push(`- Word style: ${selectedStyle.word_style}`)
    lines.push(`- Content principle: ${selectedStyle.content_principle}`)
    lines.push(`- Negative space: ${selectedStyle.negative_space}`)
    lines.push(`Style notes: ${styleNotes || ''}`.trimEnd())

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
      ratio,
      style: selectedStyle,
      layout: selectedLayout
    })

    const userPrompt = `内容：\n${article}`

    try {
      let rawContent = ''

      if (textConfig.type === 'openai') {
        const res = await nativeFetch(buildOpenAIUrl(textConfig.host, '/chat/completions'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${textConfig.key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: textConfig.textModel,
            stream: false,
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: userPrompt
              }
            ]
          })
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        if (data.error) throw new Error(data.error.message)
        rawContent = data.choices?.[0]?.message?.content || ''
      } else {
        const res = await nativeFetch(
          buildGeminiUrl(textConfig.host, `/models/${textConfig.textModel}:generateContent`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': textConfig.key
            },
            body: JSON.stringify({
              systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }]
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: userPrompt }]
                }
              ],
              generationConfig: { responseModalities: ['TEXT'] }
            })
          }
        )

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        rawContent = (data.candidates?.[0]?.content?.parts || [])
          .map((p: any) => p.text)
          .filter(Boolean)
          .join('')
      }

      const parsed = parseJsonFromContent(rawContent)
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as any)?.blocks)
          ? (parsed as any).blocks
          : parsed
            ? [parsed]
            : []

      if (!Array.isArray(list) || list.length === 0) throw new Error('返回格式不正确：未找到 blocks 数组')

      const normalized: InfographicBlock[] = list.slice(0, 1).map((item: any, i: number) => {
        const title = toOneLine(item?.title) || '信息图'
        const source = toOneLine(item?.source)

        const promptFromLines = Array.isArray(item?.promptLines)
          ? item.promptLines.filter((v: any) => typeof v === 'string').join('\n').trim()
          : ''
        const promptFromString = typeof item?.prompt === 'string' ? item.prompt.trim() : ''
        const promptFromPlan = buildPromptFromPlan(item)

        const prompt = (promptFromLines || promptFromString || promptFromPlan).trim()

        return {
          id: `ai_${Date.now()}_${i}`,
          title,
          source,
          prompt
        }
      })

      gallerySessionRef.current = null
      gallerySessionPromiseRef.current = null
      setBlocks(normalized)
      collapseConfigOnMobile()
      showToast('已生成信息图提示词', 'success')
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

    const model = buildDynamicImageModel(config.imageModel, quality, ratio, config.enableModelSuffix ?? true)

    setBlocks(prev => {
      const next = [...prev]
      next[index] = { ...next[index], imageData: 'loading' }
      return next
    })

    try {
      let imageData: string | null = null

      if (config.type === 'openai') {
        let size = '1024x1024'
        if (quality === '2K') size = '2048x2048'
        else if (quality === '4K') size = '4096x4096'

        const res = await nativeFetch(buildOpenAIUrl(config.host, '/chat/completions'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
            stream: false,
            size,
            aspect_ratio: ratio
          })
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ''
        const match = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/)
        if (match) imageData = match[1]
      } else {
        const res = await nativeFetch(buildGeminiUrl(config.host, `/models/${model}:generateContent`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.key
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ['IMAGE'],
              imageConfig: { imageSize: quality, aspectRatio: ratio }
            }
          })
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData
        if (inlineData?.data && inlineData?.mimeType) {
          imageData = `data:${inlineData.mimeType};base64,${inlineData.data}`
        }
      }

      if (!imageData) throw new Error('未返回图片数据')

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
              <h1 className="text-lg font-semibold tracking-tight truncate">信息图</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsConfigOpen(open => !open)}
                aria-expanded={isConfigOpen}
                aria-controls="infographic-config-panel"
                className="px-2.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isConfigOpen ? '收起输入' : '展开输入'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div
            id="infographic-config-panel"
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
                placeholder="粘贴内容，或点击右上角上传文件..."
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
                  '生成信息图提示词'
                )}
              </button>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-3 shadow-sm mb-3">
              <div className="text-sm font-medium mb-2">配置</div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-sm">输出张数</div>
                <div className="text-xs text-[var(--text-tertiary)]">1 张</div>
              </div>

              <label className="block text-sm mb-0.5">信息布局</label>
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
                <div className="text-sm font-medium">信息图风格</div>
                <div className="text-xs text-[var(--text-tertiary)]">点击选择，预览看大图</div>
              </div>

              <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm mb-3">
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {styleId === 'auto' ? `自动（推荐：${autoStyle.name}）` : selectedStyle.name}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)] font-serif mt-1">{selectedStyle.tag}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)] font-serif mt-1 line-clamp-2">
                        {selectedStyle.visual_style}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openLightbox(selectedStyle.preview)}
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
                      <img src={autoStyle.preview} alt="" className="w-full h-full object-cover" />
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
                          <img src={style.preview} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-2 text-xs font-medium truncate">{style.name}</div>
                        <div className="text-[11px] text-[var(--text-tertiary)] truncate font-serif">{style.tag}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {blocks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[var(--text-tertiary)]">
                在左侧粘贴内容，然后点击“生成信息图提示词”
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-[var(--text-secondary)]">
                    已生成 {blocks.length} 份信息图提示词，可编辑后生成图片
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={generateAllImages}
                      className="px-3 py-2 rounded-xl bg-[var(--success-color)] text-white text-sm shadow-sm hover:opacity-90 transition-opacity"
                    >
                      生成图片
                    </button>
                    <button
                      onClick={() => copyPrompt(0)}
                      className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      复制提示词
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {blocks.map((block, i) => (
                    <div
                      key={block.id}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm"
                    >
                      <div className="p-4 border-b border-[var(--border-color)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {block.title || '信息图'}
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
                          className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm h-32 resize-none font-serif"
                        />

                        <div
                          className="relative w-full min-h-[220px] lg:min-h-0 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl overflow-hidden"
                          style={{ aspectRatio: toAspect(ratio) }}
                        >
                          {block.imageData && block.imageData !== 'loading' && (
                            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                              <button
                                onClick={() => downloadImage(block.imageData!, `infographic_${Date.now()}_${i}.png`)}
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
