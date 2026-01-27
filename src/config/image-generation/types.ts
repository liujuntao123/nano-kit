/**
 * 文章配图风格预设类型
 * 用于 ArticleIllustrationPage 和 XHSImagesPage
 */
export type ArticleStylePreset = {
  id: string
  name: string
  desc: string
  bestFor: string
  reference: {
    colors: string[]
    background: string[]
    accents: string[]
    elements: string[]
  }
  palette: {
    primary: string
    background: string
    accent: string
  }
  previewBg: string
}

/**
 * 信息图风格预设类型
 * 用于 InfographicPage
 */
export type InfographicStylePreset = {
  id: string
  name: string
  tag: string
  preview: string
  background: string
  visual_style: string
  word_style: string
  content_principle: string
  negative_space: string
}

/**
 * 布局预设类型（通用）
 * 用于 InfographicPage
 */
export type LayoutPreset = {
  id: string
  name: string
  desc: string
  bestFor: string
  keyPoints: string[]
}

/**
 * XHS 布局预设类型（有固定 id 枚举）
 * 用于 XHSImagesPage
 */
export type XHSLayoutPresetId = 'sparse' | 'balanced' | 'dense' | 'list' | 'comparison' | 'flow'

export type XHSLayoutPreset = {
  id: XHSLayoutPresetId
  name: string
  desc: string
  bestFor: string
  keyPoints: string[]
}

/**
 * 文章配图块类型（不含 ending）
 * 用于 ArticleIllustrationPage
 */
export type ArticleIllustrationBlock = {
  id: string
  kind: 'cover' | 'content'
  title: string
  source: string
  prompt: string
  imageData?: string
}

/**
 * XHS 配图块类型（含 ending）
 * 用于 XHSImagesPage
 */
export type XHSIllustrationBlock = {
  id: string
  kind: 'cover' | 'content' | 'ending'
  title: string
  source: string
  prompt: string
  imageData?: string
}

/**
 * 信息图块类型（无 kind）
 * 用于 InfographicPage
 */
export type InfographicBlock = {
  id: string
  title: string
  source: string
  prompt: string
  imageData?: string
}

/**
 * 正文配图数量选项
 */
export type BodyCountOption = 'auto' | 1 | 2 | 3 | 4 | 6 | 8 | 10

/**
 * 关键词匹配规则
 */
export type StyleKeywordRule = {
  id: string
  keywords: string[]
}

/**
 * 信息图章节类型
 */
export type InfographicSection = {
  heading: string
  points: string[]
  data: string[]
}
