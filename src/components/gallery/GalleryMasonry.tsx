import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { downloadImage, guessImageMimeType } from '../../utils/helpers'
import * as db from '../../utils/db'
import type { Message } from '../../types'

type ReadyGalleryItem = {
  type: 'ready'
  id: string
  prompt: string
  imageBase64: string
  imageSrc: string
  mimeType: string
  timestamp: number
}

type GeneratingGalleryItem = {
  type: 'generating'
  id: string
  prompt: string
  timestamp: number
  referenceSrc?: string
}

type GalleryItem = ReadyGalleryItem | GeneratingGalleryItem

export default function GalleryMasonry({
  contentPaddingBottomClassName,
  onCountChange
}: {
  contentPaddingBottomClassName?: string
  onCountChange?: (count: number) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    galleryRefreshKey,
    activeGenerations,
    openLightbox,
    addInputImage,
    openSlicerModal,
    setPendingInputText,
    showToast
  } = useAppStore()

  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGallery = async () => {
    setLoading(true)
    setError(null)

    try {
      const sessions = await db.getAllSessions()
      const sessionMessages = await Promise.all(
        sessions.map((s) => db.getSessionMessages(s.id))
      )

      const readyItems: ReadyGalleryItem[] = []
      const sessionHasReadyItem = new Set<number>()
      const sessionMessageMap = new Map<number, Message[]>()

      for (let i = 0; i < sessionMessages.length; i++) {
        const sessionId = sessions[i].id
        const sorted = [...(sessionMessages[i] || [])].sort((a, b) => a.timestamp - b.timestamp)
        sessionMessageMap.set(sessionId, sorted)

        const extracted = extractGalleryItemsFromSession(sorted)
        if (extracted.length > 0) sessionHasReadyItem.add(sessionId)
        readyItems.push(...extracted)
      }

      readyItems.sort((a, b) => b.timestamp - a.timestamp)

      const generatingItems: GeneratingGalleryItem[] = []
      for (const sessionId of Array.from(activeGenerations)) {
        // Avoid showing a "generating" placeholder once the session already has images.
        if (sessionHasReadyItem.has(sessionId)) continue

        const messages = sessionMessageMap.get(sessionId) || []
        const lastUser = [...messages].reverse().find(m => m.role === 'user')

        const prompt = (lastUser?.content || '').trim()
        const timestamp = lastUser?.timestamp || sessionId

        let referenceSrc: string | undefined
        const referenceBase64 = lastUser?.images?.[0]
        if (referenceBase64) {
          const mimeType = guessImageMimeType(referenceBase64)
          referenceSrc = referenceBase64.startsWith('data:')
            ? referenceBase64
            : `data:${mimeType};base64,${referenceBase64}`
        }

        generatingItems.push({
          type: 'generating',
          id: `generating_${sessionId}`,
          prompt,
          timestamp,
          referenceSrc
        })
      }

      generatingItems.sort((a, b) => b.timestamp - a.timestamp)

      const nextItems: GalleryItem[] = [...generatingItems, ...readyItems]
      setItems(nextItems)
      onCountChange?.(readyItems.length)
    } catch (e: any) {
      const msg = e?.message || '加载失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGallery()
  }, [galleryRefreshKey, activeGenerations])

  const savePromptToMyPrompts = (prompt: string) => {
    const text = (prompt || '').trim()
    if (!text) {
      showToast('无提示词可收藏', 'warning')
      return
    }

    try {
      const saved = JSON.parse(localStorage.getItem('custom_prompts') || '[]')
      const arr = Array.isArray(saved) ? saved : []

      const exists = arr.some((p: any) => {
        const content = (p?.content ?? p?.prompt ?? '').toString().trim()
        return content === text
      })

      if (exists) {
        showToast('该提示词已在收藏中', 'warning')
        return
      }

      const titleBase = text.split('\n')[0]?.trim() || '画廊收藏'
      const title = titleBase.length > 24 ? `${titleBase.slice(0, 24)}...` : titleBase
      const now = Date.now()

      arr.unshift({
        id: `prompt_${now}`,
        title,
        content: text,
        createdAt: now,
        updatedAt: now
      })

      localStorage.setItem('custom_prompts', JSON.stringify(arr))
      showToast('已收藏到我的提示词', 'success')
    } catch (e) {
      console.error('Failed to save prompt:', e)
      showToast('收藏失败', 'error')
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="py-12 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
        <div className="loading-spinner mr-2" />
        正在加载作品...
      </div>
    )
  }

  if (error && items.length === 0) {
    return (
      <div className="py-10 text-sm text-[var(--danger-color)]">
        加载失败：{error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-sm text-[var(--text-secondary)]">还没有生成过图片</div>
        <div className="text-xs text-[var(--text-tertiary)] mt-1">在下方输入提示词开始创作</div>
      </div>
    )
  }

  return (
    <div className={contentPaddingBottomClassName || ''}>
      <div className="columns-1 sm:columns-2 lg:columns-3 [column-gap:1rem]">
        {items.map((item) => (
          <div key={item.id} className="mb-4 w-full inline-block [break-inside:avoid]">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden shadow-sm">
              {item.type === 'generating' ? (
                <div className="relative w-full aspect-square bg-[var(--bg-tertiary)] overflow-hidden">
                  {item.referenceSrc ? (
                    <img
                      src={item.referenceSrc}
                      alt=""
                      className="w-full h-full object-cover scale-105 blur-[2px] opacity-70"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--border-color)]" />
                  )}

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(20,20,19,0.58)] text-white text-xs backdrop-blur-sm">
                      <div className="loading-spinner w-4 h-4" />
                      生成中
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative group">
                  <img
                    src={item.imageSrc}
                    alt=""
                    className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => openLightbox(item.imageSrc)}
                    loading="lazy"
                  />

                  {/* Top-right floating actions */}
                  <div className="absolute top-2 right-2 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <OverlayActionButton
                      label="下载"
                      onClick={() => downloadImage(item.imageSrc, `gemini_${item.timestamp}.png`)}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      }
                    />
                    <OverlayActionButton
                      label="编辑图片"
                      onClick={() => {
                        openSlicerModal(item.imageSrc)
                        navigate('/editor')
                      }}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              )}

              <div className="p-3">
                <PromptBlock prompt={item.prompt} />

                {item.type === 'ready' ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <SmallButton
                      onClick={() => {
                        navigator.clipboard.writeText(item.prompt || '').then(() => {
                          showToast('已复制提示词', 'success')
                        })
                      }}
                      label="复制提示词"
                      icon={(
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <rect x="3" y="3" width="13" height="13" rx="2" />
                        </svg>
                      )}
                    />
                    <SmallButton
                      onClick={() => savePromptToMyPrompts(item.prompt)}
                      label="收藏提示词"
                      icon={(
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 17l-5 3 1-6-4-4 6-1 2-5 2 5 6 1-4 4 1 6z" />
                        </svg>
                      )}
                    />
                    <SmallButton
                      onClick={() => {
                        const text = (item.prompt || '').trim()
                        if (!text) {
                          showToast('无提示词可应用', 'warning')
                          return
                        }
                        setPendingInputText(text)
                        showToast('提示词已填充到输入框', 'success')
                        if (location.pathname !== '/create') {
                          navigate('/create')
                        }
                      }}
                      label="应用提示词"
                      icon={(
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 3v12" />
                          <path d="M8 11l4 4 4-4" />
                          <path d="M5 21h14" />
                        </svg>
                      )}
                    />
                    <SmallButton
                      onClick={() => {
                        addInputImage({
                          base64: item.imageBase64,
                          mimeType: item.mimeType,
                          preview: item.imageSrc
                        })
                        showToast('已添加为参考图', 'success')
                      }}
                      label="设为参考图"
                      icon={(
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="5" width="18" height="14" rx="2" />
                          <circle cx="8" cy="10" r="2" />
                          <path d="M21 17l-5-5-4 4-2-2-5 5" />
                        </svg>
                      )}
                    />
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-[var(--text-tertiary)]">
                    正在生成图片...
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function extractGalleryItemsFromSession(messages: Message[]): ReadyGalleryItem[] {
  let lastPrompt = ''
  const items: ReadyGalleryItem[] = []

  for (const msg of messages) {
    if (msg.role === 'user') {
      lastPrompt = (msg.content || '').trim()
      continue
    }

    if (msg.role !== 'bot') continue
    if (!msg.images || msg.images.length === 0) continue

    msg.images.forEach((img, index) => {
      const mimeType = guessImageMimeType(img)
      const imageSrc = img.startsWith('data:') ? img : `data:${mimeType};base64,${img}`

      items.push({
        type: 'ready',
        id: `${msg.sessionId}_${msg.id ?? msg.timestamp}_${index}`,
        prompt: lastPrompt,
        imageBase64: img.startsWith('data:') ? img.split(',')[1] || '' : img,
        imageSrc,
        mimeType,
        timestamp: msg.timestamp
      })
    })
  }

  return items
}

function PromptBlock({ prompt }: { prompt: string }) {
  const safePrompt = prompt ? prompt : '（无提示词）'
  const [expanded, setExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (!el) return

    const id = window.requestAnimationFrame(() => {
      // When collapsed, max height applies and overflow can be detected by scrollHeight.
      setIsOverflowing(el.scrollHeight > el.clientHeight + 1)
    })
    return () => window.cancelAnimationFrame(id)
  }, [safePrompt])

  const showToggle = isOverflowing || expanded

  return (
    <div>
      <div
        ref={textRef}
        className={[
          'text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-words font-serif',
          expanded ? 'max-h-60 overflow-y-auto pr-1' : 'max-h-24 overflow-hidden',
          showToggle && !expanded ? 'relative' : ''
        ].join(' ')}
        title={safePrompt}
      >
        {safePrompt}
        {showToggle && !expanded && (
          <div className="absolute left-0 right-0 bottom-0 h-8 bg-gradient-to-t from-[var(--bg-secondary)] to-transparent" />
        )}
      </div>

      {showToggle && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-2 text-xs text-[var(--link-color)] hover:underline"
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
    </div>
  )
}

function SmallButton({ label, onClick, icon }: { label: string; onClick: () => void; icon: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-8 w-8 inline-flex items-center justify-center rounded-xl text-xs bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)] shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
    >
      <span className="sr-only">{label}</span>
      <span className="opacity-90">{icon}</span>
    </button>
  )
}

function OverlayActionButton({
  label,
  onClick,
  icon
}: {
  label: string
  onClick: () => void
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[rgba(20,20,19,0.55)] text-white text-xs border border-white/15 backdrop-blur-sm hover:bg-[rgba(20,20,19,0.72)] transition-colors shadow-sm"
      aria-label={label}
      title={label}
    >
      <span className="opacity-90">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
