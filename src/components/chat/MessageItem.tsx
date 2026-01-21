import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import { downloadImage } from '../../utils/helpers'
import type { Message } from '../../types'

interface MessageItemProps {
  message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
  const navigate = useNavigate()
  const { openLightbox, deleteMessage, openSlicerModal, addInputImage, showToast, showConfirm } = useAppStore()

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('已复制', 'success')
    })
  }

  const handleUseAsReference = (base64: string) => {
    const fullB64 = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
    addInputImage({
      base64: fullB64.split(',')[1],
      mimeType: 'image/jpeg',
      preview: fullB64
    })
    showToast('已添加为参考图', 'success')
  }

  const handleDownload = (base64: string) => {
    const filename = `gemini_${Date.now()}.png`
    downloadImage(base64, filename)
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4 animate-slideUp">
        <div className="max-w-[80%]">
          {/* User Images */}
          {message.images && message.images.length > 0 && (
            <div className="flex gap-1 flex-wrap justify-end mb-2">
              {message.images.map((img, i) => {
                const src = img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
                return (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:opacity-90"
                    onClick={() => openLightbox(src)}
                  />
                )
              })}
            </div>
          )}

          {/* User Text */}
          {message.content && (
            <div className="bg-[var(--accent-color)] text-white px-4 py-2 rounded-2xl rounded-br-md">
              <div className="whitespace-pre-wrap break-words text-sm font-serif">
                {message.content}
              </div>
            </div>
          )}

          {/* User Actions */}
          <div className="flex gap-2 mt-1 justify-end text-xs text-[var(--text-tertiary)]">
            <button
              onClick={() => handleCopy(message.content)}
              className="hover:text-[var(--text-primary)] flex items-center gap-1"
            >
              <CopyIcon /> 复制
            </button>
            {message.id && (
              <button
                onClick={() => {
                  showConfirm({
                    title: '删除消息',
                    message: '确定删除这条消息吗？',
                    type: 'danger',
                    onConfirm: () => deleteMessage(message.id!)
                  })
                }}
                className="hover:text-[var(--danger-color)] flex items-center gap-1"
              >
                <DeleteIcon /> 删除
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Bot message
  return (
    <div className="flex justify-start mb-4 animate-slideUp">
      <div className="max-w-[85%]">
        {/* Render HTML content or parse for images */}
        {message.rawHtml ? (
          <BotContent
            rawHtml={message.rawHtml}
            onImageClick={openLightbox}
            onDownload={handleDownload}
            onUseAsRef={handleUseAsReference}
            onSlice={(src) => {
              openSlicerModal(src)
              navigate('/editor')
            }}
          />
        ) : (
          <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-2xl rounded-bl-md">
            <div className="whitespace-pre-wrap break-words text-sm font-serif">
              {message.content}
            </div>
          </div>
        )}

        {/* Bot Actions */}
        {message.id && (
          <div className="flex gap-2 mt-1 text-xs text-[var(--text-tertiary)]">
            <button
              onClick={() => {
                if (confirm('确定删除这条消息吗？')) {
                  deleteMessage(message.id!)
                }
              }}
              className="hover:text-[var(--danger-color)] flex items-center gap-1"
            >
              <DeleteIcon /> 删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function BotContent({
  rawHtml,
  onImageClick,
  onDownload,
  onUseAsRef,
  onSlice
}: {
  rawHtml: string
  onImageClick: (src: string) => void
  onDownload: (src: string) => void
  onUseAsRef: (src: string) => void
  onSlice: (src: string) => void
}) {
  // Parse the HTML to extract images and text
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')

  const images = doc.querySelectorAll('img.generated-image')
  const textContent = doc.body.textContent?.trim() || ''

  // Check if it's an error message
  if (rawHtml.includes('❌ Error')) {
    return (
      <div className="bg-[color:rgba(178,58,58,0.12)] text-[var(--danger-color)] px-4 py-3 rounded-2xl rounded-bl-md border border-[color:rgba(178,58,58,0.22)]">
        <div className="whitespace-pre-wrap break-words text-sm" dangerouslySetInnerHTML={{ __html: rawHtml }} />
      </div>
    )
  }

  // Check if it's a loading/progress state
  if (rawHtml.includes('loading-spinner') || rawHtml.includes('图片生成中')) {
    return (
      <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-2">
          <div className="loading-spinner" />
          <span className="text-sm text-[var(--text-secondary)]">生成中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Render images with action buttons */}
      {Array.from(images).map((img, i) => {
        const src = img.getAttribute('src') || ''
        return (
          <div key={i} className="bg-[var(--bg-secondary)] p-3 rounded-2xl rounded-bl-md">
            <img
              src={src}
              alt=""
              className="max-w-full rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => onImageClick(src)}
            />
            <div className="flex flex-wrap gap-2 mt-3">
              <ActionButton onClick={() => onDownload(src)} icon={<DownloadIcon />} label="下载" />
              <ActionButton onClick={() => onUseAsRef(src)} icon={<UploadIcon />} label="设为参考图" />
              <ActionButton onClick={() => onSlice(src)} icon={<SliceIcon />} label="切片" />
            </div>
          </div>
        )
      })}

      {/* Render text content if no images or has additional text */}
      {images.length === 0 && textContent && (
        <div className="bg-[var(--bg-secondary)] px-4 py-3 rounded-2xl rounded-bl-md">
          <div className="whitespace-pre-wrap break-words text-sm font-serif">{textContent}</div>
        </div>
      )}
    </div>
  )
}

function ActionButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--bg-primary)] text-[var(--text-secondary)]
                 rounded-xl border border-[var(--border-color)] shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

// Icons
function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function SliceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 3L6 21" />
      <path d="M18 3L18 21" />
      <path d="M2 12L22 12" />
    </svg>
  )
}
