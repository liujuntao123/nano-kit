/**
 * 图片生成配置模块
 * 统一导出所有配置和类型
 */

// 类型定义
export * from './types'

// 文章配图风格预设
export { ARTICLE_STYLE_PRESETS } from './article-styles'

// 信息图风格预设
export { INFOGRAPHIC_STYLE_PRESETS } from './infographic-styles'

// 信息图布局预设
export { INFOGRAPHIC_LAYOUT_PRESETS } from './infographic-layouts'

// 小红书风格预设
export { XHS_STYLE_PRESETS } from './xhs-styles'

// 小红书布局预设
export { XHS_LAYOUT_PRESETS } from './xhs-layouts'

// 关键词匹配规则和函数
export {
  ARTICLE_STYLE_KEYWORDS,
  INFOGRAPHIC_STYLE_KEYWORDS,
  XHS_STYLE_KEYWORDS,
  matchBestStyleId
} from './style-keywords'
