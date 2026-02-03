import type { Provider } from '../types'
import { buildDynamicImageModel, buildGeminiUrl, buildOpenAIUrl, nativeFetch } from '../utils/helpers'

export type ImageQuality = '1K' | '2K' | '4K'

export interface TextGenerationInput {
  systemPrompt: string
  userPrompt: string
}

export interface ImageGenerationInput {
  prompt: string
  quality: ImageQuality
  ratio: string
  enableModelSuffix?: boolean
}

export async function requestTextGeneration(
  config: Provider,
  input: TextGenerationInput
): Promise<string> {
  const { systemPrompt, userPrompt } = input

  if (config.type === 'openai') {
    const res = await nativeFetch(buildOpenAIUrl(config.host, '/chat/completions'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.textModel,
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
    return data.choices?.[0]?.message?.content || ''
  }

  const res = await nativeFetch(
    buildGeminiUrl(config.host, `/models/${config.textModel}:generateContent`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.key
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
  return (data.candidates?.[0]?.content?.parts || [])
    .map((part: any) => part.text)
    .filter(Boolean)
    .join('')
}

export async function requestImageGeneration(
  config: Provider,
  input: ImageGenerationInput
): Promise<string> {
  const { prompt, quality, ratio, enableModelSuffix = true } = input
  const model = buildDynamicImageModel(config.imageModel, quality, ratio, enableModelSuffix)

  if (config.type === 'openai') {
    const size = getOpenAIImageSize(quality)

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
    if (data.error) throw new Error(data.error.message)

    const content = data.choices?.[0]?.message?.content || ''
    const match = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/)
    if (match) return match[1]

    throw new Error('未返回图片数据')
  }

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
  if (data.error) throw new Error(data.error.message)

  const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData
  if (inlineData?.data && inlineData?.mimeType) {
    return `data:${inlineData.mimeType};base64,${inlineData.data}`
  }

  throw new Error('未返回图片数据')
}

export function normalizeModelBlocks(parsed: unknown): any[] {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') {
    const blocks = (parsed as any).blocks
    if (Array.isArray(blocks)) return blocks
    return [parsed]
  }
  return []
}

function getOpenAIImageSize(quality: ImageQuality): string {
  if (quality === '2K') return '2048x2048'
  if (quality === '4K') return '4096x4096'
  return '1024x1024'
}
