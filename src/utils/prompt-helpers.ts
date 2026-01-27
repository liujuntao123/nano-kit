/**
 * 共享的提示词处理工具函数
 * 用于 ArticleIllustrationPage、InfographicPage、XHSImagesPage
 */

/**
 * 解析模型返回内容中的 JSON
 * 支持从 markdown 代码块、纯 JSON 文本中提取
 */
export function parseJsonFromContent(content: string): unknown {
  const cleaned = content.replace(/```json|```/gi, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // best-effort extract object
    const objStart = cleaned.indexOf('{')
    const objEnd = cleaned.lastIndexOf('}')
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      try {
        return JSON.parse(cleaned.slice(objStart, objEnd + 1))
      } catch {}
    }

    // best-effort extract array
    const arrStart = cleaned.indexOf('[')
    const arrEnd = cleaned.lastIndexOf(']')
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      try {
        return JSON.parse(cleaned.slice(arrStart, arrEnd + 1))
      } catch {}
    }
    throw new Error('无法解析模型返回的 JSON')
  }
}

/**
 * 将任意值转换为单行字符串
 * 移除多余的空白字符
 */
export function toOneLine(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''
}

/**
 * 将值转换为普通对象
 * 如果不是对象或是数组，返回 null
 */
export function asPlainObject(v: unknown): Record<string, any> | null {
  if (typeof v !== 'object' || v === null) return null
  if (Array.isArray(v)) return null
  return v as Record<string, any>
}

/**
 * 将值转换为字符串数组
 * 支持数组或单个字符串输入
 */
export function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(item => toOneLine(item)).filter(Boolean)
  const single = toOneLine(v)
  return single ? [single] : []
}

/**
 * 根据比例推断图片方向
 */
export function inferOrientation(ratio: string): 'Landscape (horizontal)' | 'Portrait (vertical)' | 'Square' {
  const parts = ratio.split(':').map(n => Number(n))
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1]) || parts[0] <= 0 || parts[1] <= 0) {
    return 'Square'
  }
  if (parts[0] > parts[1]) return 'Landscape (horizontal)'
  if (parts[0] < parts[1]) return 'Portrait (vertical)'
  return 'Square'
}

/**
 * 将比例字符串转换为 CSS aspect-ratio 格式
 * 例如: "16:9" -> "16 / 9"
 */
export function toAspect(ratio: string): string {
  const parts = ratio.split(':').map(n => Number(n))
  if (parts.length !== 2 || !parts[0] || !parts[1]) return '1 / 1'
  return `${parts[0]} / ${parts[1]}`
}
