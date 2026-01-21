// Escape HTML to prevent XSS
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m] || m)
}

function isProxyEnabled(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function shouldProxyUrl(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false
  try {
    const parsed = new URL(url)
    if (parsed.origin === window.location.origin && parsed.pathname === '/proxy') {
      return false
    }
  } catch (_) {
    return false
  }
  return true
}

// Native fetch to bypass extension interception (optionally via /proxy).
export function nativeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const proxyEnabled = isProxyEnabled(import.meta.env.PROXY)
  if (!proxyEnabled) {
    return window.fetch(input, init)
  }

  const url = input instanceof Request ? input.url : input.toString()
  if (!shouldProxyUrl(url)) {
    return window.fetch(input, init)
  }

  const proxyUrl = `/proxy?url=${encodeURIComponent(url)}`
  if (input instanceof Request) {
    const proxiedRequest = new Request(proxyUrl, input)
    return window.fetch(proxiedRequest, init)
  }

  return window.fetch(proxyUrl, init)
}

function normalizeHost(host: string): string {
  return (host || '').trim().replace(/\/+$/, '')
}

function joinUrl(base: string, path: string): string {
  const normalizedPath = (path || '').replace(/^\/+/, '')
  if (!normalizedPath) return base
  const normalizedBase = base.replace(/\/+$/, '')
  if (normalizedBase.toLowerCase().endsWith(`/${normalizedPath.toLowerCase()}`)) {
    return normalizedBase
  }
  return `${normalizedBase}/${normalizedPath}`
}

function ensureVersionedHost(host: string, version: string, versionRegex: RegExp): string {
  const normalized = normalizeHost(host)
  if (!normalized) return normalized
  if (versionRegex.test(normalized)) return normalized
  return `${normalized}/${version}`
}

export function buildOpenAIUrl(host: string, path: string): string {
  const base = ensureVersionedHost(host, 'v1', /\/v\d+(?=\/|$)/i)
  return joinUrl(base, path)
}

export function buildGeminiUrl(host: string, path: string): string {
  const base = ensureVersionedHost(host, 'v1beta', /\/v1beta(?=\/|$)/i)
  return joinUrl(base, path)
}

// Best-effort MIME detection for base64 image payloads (stored without data: prefix in DB).
export function guessImageMimeType(base64OrDataUrl: string): string {
  const s = (base64OrDataUrl || '').trim()
  if (!s) return 'image/png'

  if (s.startsWith('data:')) {
    const match = s.match(/^data:([^;]+);base64,/)
    return match?.[1] || 'image/png'
  }

  // JPEG: /9j/
  if (s.startsWith('/9j/')) return 'image/jpeg'
  // PNG: iVBORw0KGgo
  if (s.startsWith('iVBORw0KGgo')) return 'image/png'
  // GIF: R0lGOD
  if (s.startsWith('R0lGOD')) return 'image/gif'
  // WEBP: UklGR
  if (s.startsWith('UklGR')) return 'image/webp'

  return 'image/png'
}

// Convert base64 to blob URL
export function base64ToBlobUrl(base64Data: string): string {
  try {
    const arr = base64Data.split(',')
    const mimeMatch = arr[0].match(/:(.*?);/)
    if (!mimeMatch) return ''
    const mime = mimeMatch[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return URL.createObjectURL(new Blob([u8arr], { type: mime }))
  } catch (e) {
    console.error('base64ToBlobUrl error:', e)
    return ''
  }
}

// Compress image
export function compressImage(file: File): Promise<{ base64: string; mimeType: string; preview: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        let w = img.width
        let h = img.height
        const max = 1536

        if (file.size < 1024 * 1024 && w < max && h < max) {
          const result = e.target?.result as string
          resolve({
            base64: result.split(',')[1],
            mimeType: file.type,
            preview: result
          })
          return
        }

        if (w > h) {
          if (w > max) {
            h *= max / w
            w = max
          }
        } else {
          if (h > max) {
            w *= max / h
            h = max
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: 'image/jpeg',
          preview: dataUrl
        })
      }
    }
  })
}

// Download image
export function downloadImage(base64Data: string, filename: string): void {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isLocalFile = window.location.protocol === 'file:'

  if (isIOS || isSafari || isLocalFile) {
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${filename}</title>
          <style>
            body { margin: 0; padding: 20px; background: #000; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
            img { max-width: 100%; height: auto; border-radius: 8px; }
            .tip { color: #fff; margin-top: 20px; text-align: center; font-family: sans-serif; font-size: 14px; }
          </style>
        </head>
        <body>
          <img src="${base64Data}" alt="${filename}">
          <div class="tip">长按图片保存</div>
        </body>
        </html>
      `)
      newWindow.document.close()
    }
  } else {
    const link = document.createElement('a')
    link.href = base64Data
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Build a dynamic image model name like: "gemini-3-pro-image-2k-4x3"
// Some backends use the model id to select resolution/aspect ratio.
export function buildDynamicImageModel(
  model: string,
  resolution?: string,
  aspectRatio?: string,
  appendSuffix = true
): string {
  const raw = (model || '').trim()
  if (!raw) return raw
  // Keep non-Gemini model ids untouched (e.g. OpenAI image models).
  if (!/gemini/i.test(raw)) return raw

  const res = (resolution || '').trim().toLowerCase().replace(/\s+/g, '')
  const ratio = (aspectRatio || '').trim().toLowerCase().replace(/\s+/g, '')

  // When users don't explicitly set an aspect ratio, omit it instead of appending "auto".
  // Some gateways treat "-auto" as an invalid model suffix.
  const normalizedRatio = !ratio || ratio === 'auto' ? '' : ratio.replace(/:/g, 'x')

  // Avoid double-appending when the stored model already contains a size suffix.
  const base = raw.replace(/-(?:\d+k)(?:-(?:auto|\d+x\d+))?$/i, '')

  const suffixParts: string[] = []
  if (res) suffixParts.push(res)
  if (normalizedRatio) suffixParts.push(normalizedRatio)

  if (!appendSuffix) return base
  if (suffixParts.length === 0) return base
  return `${base}-${suffixParts.join('-')}`
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
