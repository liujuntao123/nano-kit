import { useAppStore } from '../store/appStore'
import { nativeFetch, escapeHtml, buildDynamicImageModel, buildOpenAIUrl, buildGeminiUrl } from '../utils/helpers'
import type { ImageState } from '../types'
import * as db from '../utils/db'

export async function sendMessage(text: string, images: ImageState[]) {
  const store = useAppStore.getState()
  const {
    resolution,
    aspectRatio,
    getActiveConfig,
    saveMessage,
    updateSessionTitle,
    loadSessions,
    addActiveGeneration,
    removeActiveGeneration,
    showToast
  } = store

  const config = getActiveConfig()

  if (!config) {
    showToast('请先在设置中添加 API 渠道', 'warning')
    return
  }
  if (!config.imageModel) {
    showToast('请先在设置中填写绘图模型', 'warning')
    return
  }

  // Single-turn generation: every send starts a fresh session.
  const sessionId = await store.createSession('新对话')

  // Save user message
  const userHtml = text ? `<div class="msg-content">${escapeHtml(text).replace(/\n/g, '<br>')}</div>` : ''
  const imagesBase64 = images.map(i => i.base64)
  await saveMessage(sessionId, 'user', text, imagesBase64, userHtml)

  // Update session title if first message
  const messages = await db.getSessionMessages(sessionId)
  if (messages.length <= 1 && text) {
    const newTitle = text.substring(0, 20) + (text.length > 20 ? '...' : '')
    await updateSessionTitle(sessionId, newTitle)
    await loadSessions()
  }

  // Add loading message
  addActiveGeneration(sessionId)

  try {
    let data: any

    if (config.type === 'openai') {
      data = await callOpenAIAPI(config, text, imagesBase64, {
        resolution,
        aspectRatio
      })
    } else {
      data = await callGeminiAPI(config, text, imagesBase64, {
        resolution,
        aspectRatio
      })
    }

    // Process response
    await processResponse(data, sessionId)

  } catch (e: any) {
    console.error('API Error:', e)
    let msg = e.message || '未知错误'
    try {
      const jsonErr = JSON.parse(e.message)
      if (jsonErr.error?.message) msg = jsonErr.error.message
    } catch (_) {}

    const errorHtml = `<div class="msg-content" style="color:#d93025">❌ Error: ${escapeHtml(msg)}</div>`
    await saveMessage(sessionId, 'bot', 'Error', [], errorHtml)
    showToast('生成失败: ' + msg, 'error', 3000)
  } finally {
    removeActiveGeneration(sessionId)
  }
}

async function callOpenAIAPI(
  config: any,
  text: string,
  imagesBase64: string[],
  options: any
) {
  const { resolution, aspectRatio } = options
  const model = buildDynamicImageModel(config.imageModel, resolution, aspectRatio)

  const messages: any[] = []

  // Add current message
  const currentMessage: any = {
    role: 'user',
    content: [{ type: 'text', text: text || 'Generate image' }]
  }

  imagesBase64.forEach(b64 => {
    currentMessage.content.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}` }
    })
  })

  messages.push(currentMessage)

  // Determine size
  let size = '1024x1024'
  if (resolution === '2K') size = '2048x2048'
  else if (resolution === '4K') size = '4096x4096'

  const payload: any = {
    model,
    messages,
    stream: true,
    size
  }

  if (aspectRatio !== 'auto') {
    payload.aspect_ratio = aspectRatio
  }

  const res = await nativeFetch(buildOpenAIUrl(config.host, '/chat/completions'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(errorText)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('text/event-stream')) {
    return await parseStreamResponse(res)
  }

  return await res.json()
}

async function callGeminiAPI(
  config: any,
  text: string,
  imagesBase64: string[],
  options: any
) {
  const { resolution, aspectRatio } = options
  const model = buildDynamicImageModel(config.imageModel, resolution, aspectRatio)

  const contents: any[] = []

  // Add current message
  const currentParts: any[] = text ? [{ text }] : [{ text: 'Generate image' }]
  imagesBase64.forEach(b64 => {
    currentParts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } })
  })
  contents.push({ role: 'user', parts: currentParts })

  const generationConfig: any = {
    responseModalities: ['TEXT', 'IMAGE'],
    imageConfig: { imageSize: resolution }
  }

  if (aspectRatio && aspectRatio !== 'auto') {
    generationConfig.imageConfig.aspectRatio = aspectRatio
  }

  const payload = { contents, generationConfig }

  const res = await nativeFetch(
    buildGeminiUrl(config.host, `/models/${model}:generateContent`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.key
      },
      body: JSON.stringify(payload)
    }
  )

  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))

  return data
}

async function parseStreamResponse(response: Response) {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const json = JSON.parse(data)
          if (json.choices?.[0]?.delta?.content) {
            fullContent += json.choices[0].delta.content
          }
        } catch (e) {
          console.warn('Parse SSE error:', e)
        }
      }
    }
  }

  return {
    choices: [{
      message: { content: fullContent }
    }]
  }
}

async function processResponse(data: any, sessionId: number) {
  const store = useAppStore.getState()
  const { saveMessage, bumpGalleryRefreshKey } = store

  let botHtml = ''
  const generatedImages: string[] = []

  // Handle OpenAI format
  if (data.choices?.[0]?.message?.content) {
    const content = data.choices[0].message.content

    // Extract images from markdown
    const dataUrlMatch = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/)
    const httpUrlMatch = content.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/)

    if (dataUrlMatch) {
      const imageData = dataUrlMatch[1].split(',')[1]
      generatedImages.push(imageData)
      const fullBase64 = dataUrlMatch[1]
      const filename = `gemini_${Date.now()}.png`

      botHtml += createImageHtml(fullBase64, filename)
    } else if (httpUrlMatch) {
      // Fetch remote image
      try {
        const imgRes = await nativeFetch(httpUrlMatch[1])
        const blob = await imgRes.blob()
        const reader = new FileReader()
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve((reader.result as string).split(',')[1])
          reader.readAsDataURL(blob)
        })
        generatedImages.push(base64)
        const fullBase64 = `data:image/jpeg;base64,${base64}`
        const filename = `gemini_${Date.now()}.png`
        botHtml += createImageHtml(fullBase64, filename)
      } catch (e) {
        console.error('Failed to fetch image:', e)
      }
    }

    // Extract text content
    const textContent = content
      .replace(/!\[.*?\]\((data:image\/[^)]+)\)/g, '')
      .replace(/!\[.*?\]\((https?:\/\/[^)]+)\)/g, '')
      .trim()

    if (textContent) {
      botHtml = `<div class="msg-content" style="padding:12px 18px; white-space:pre-wrap;">${escapeHtml(textContent)}</div>` + botHtml
    }
  }

  // Handle Gemini format
  if (data.candidates?.[0]?.content?.parts) {
    data.candidates[0].content.parts.forEach((part: any) => {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        const fullBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        generatedImages.push(part.inlineData.data)
        const filename = `gemini_${Date.now()}.png`
        botHtml += createImageHtml(fullBase64, filename)
      } else if (part.text) {
        // Check for embedded images in text
        const imgRegex = /!\[([^\]]*)\]\(((?:https?:|data:image\/)[^)]+)\)/g
        let textContent = part.text
        let match

        while ((match = imgRegex.exec(textContent)) !== null) {
          const url = match[2]
          const filename = `image_${Date.now()}.png`

          if (url.startsWith('data:')) {
            const base64Data = url.split(',')[1]
            if (base64Data) generatedImages.push(base64Data)
            botHtml += createImageHtml(url, filename)
          }
        }

        textContent = textContent.replace(imgRegex, '').trim()
        if (textContent) {
          botHtml += `<div class="msg-content" style="padding:12px 18px;"><details class="thought-box"><summary>Thinking / Output</summary><div>${escapeHtml(textContent)}</div></details></div>`
        }
      }
    })
  }

  if (botHtml) {
    await saveMessage(sessionId, 'bot', 'Image Generated', generatedImages, botHtml)
    bumpGalleryRefreshKey()
    store.showToast('生成完成', 'success')
  }
}

function createImageHtml(fullBase64: string, filename: string): string {
  return `
    <div class="msg-content" style="padding:0">
      <div class="img-result-group">
        <img class="generated-image" src="${fullBase64}" data-filename="${filename}">
        <div class="btn-group">
          <div class="tool-btn download">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg> 下载原图
          </div>
          <div class="tool-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg> 设为参考图
          </div>
          <div class="tool-btn slice-btn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 3L6 21"/>
              <path d="M18 3L18 21"/>
              <path d="M2 12L22 12"/>
            </svg> 切割/表情包
          </div>
        </div>
      </div>
    </div>
  `
}
