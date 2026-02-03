import { useRef, useState, useCallback, useEffect, DragEvent } from 'react'
import { useAppStore } from '../../store/appStore'
import { compressImage } from '../../utils/helpers'

export default function ChatInput({ variant = 'inline' }: { variant?: 'inline' | 'floating' }) {
  const {
    inputImages,
    addInputImage,
    removeInputImage,
    clearInputImages,
    resolution,
    aspectRatio,
    showToast,
    openBananaModal,
    pendingInputText,
    setPendingInputText,
    setResolution,
    setAspectRatio
  } = useAppStore()

  const [text, setText] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Listen for pending input text from modals
  useEffect(() => {
    if (pendingInputText) {
      setText(pendingInputText)
      setPendingInputText(null)
      // Focus and adjust height
      setTimeout(() => {
        textareaRef.current?.focus()
        adjustHeight()
      }, 100)
    }
  }, [pendingInputText])

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const maxHeight = 320
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = maxHeight + 'px'
        textarea.style.overflowY = 'auto'
      } else {
        textarea.style.height = textarea.scrollHeight + 'px'
        textarea.style.overflowY = 'hidden'
      }
    }
  }, [])

  const handleFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (inputImages.length + imageFiles.length > 14) {
      showToast('最多14张图片', 'warning')
      return
    }
    for (const file of imageFiles) {
      const compressed = await compressImage(file)
      addInputImage(compressed)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          await handleFiles([file])
          showToast('已粘贴图片', 'success')
        }
      }
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const current = e.currentTarget as HTMLElement
    const next = e.relatedTarget as Node | null
    if (next && current.contains(next)) return
    setIsDragOver(false)
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) {
      await handleFiles(files)
      showToast(`已添加 ${files.length} 张图片`, 'success')
    }
  }

  const handleSend = async () => {
    const trimmedText = text.trim()
    if (!trimmedText && inputImages.length === 0) return

    const { sendMessage } = await import('../../services/api')
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await sendMessage(trimmedText, inputImages)
    clearInputImages()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = text.trim().length > 0 || inputImages.length > 0

  const wrapperClassName =
    variant === 'floating' ? '' : 'border-t border-[var(--border-color)] bg-[var(--bg-primary)] p-4'

  const composerClassName = [
    'group relative w-full overflow-hidden rounded-[24px] border transition-all duration-300',
    'bg-[var(--bg-primary)]',
    variant === 'floating' ? 'shadow-[0_1px_6px_rgba(0,0,0,0.04)]' : '',
    'focus-within:border-[rgba(197,197,192,1)] focus-within:shadow-[0_8px_30px_rgba(0,0,0,0.08)]',
    isDragOver ? 'border-dashed border-[var(--link-color)] bg-[var(--highlight)]' : 'border-[var(--border-color)]'
  ].join(' ')

  return (
    <div className={wrapperClassName}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={composerClassName}
      >
        <div className="flex flex-col w-full max-h-[500px] overflow-y-auto">
          {/* Image Previews */}
          <div className="flex flex-wrap gap-3 px-5 pt-5">
            {inputImages.map((img, i) => (
              <div
                key={i}
                className="relative group/img w-20 h-20 rounded-xl overflow-hidden border border-[var(--border-color)] shadow-sm bg-[var(--bg-secondary)]"
              >
                <img src={img.preview} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => removeInputImage(i)}
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black text-white rounded-full p-0.5 opacity-0 group-hover/img:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-[var(--border-color)] flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] transition-colors"
              title="添加图片"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              adjustHeight()
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="给 AI 发送指令，支持粘贴或拖拽图片..."
            className="w-full min-h-[120px] bg-transparent border-none outline-none focus:ring-0 focus-visible:outline-none resize-none leading-relaxed px-5 py-4 pb-16 text-[16px] sm:text-[18px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>

        {/* Floating toolbar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-transparent pointer-events-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={openBananaModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-full transition-colors text-sm font-medium bg-[var(--bg-primary)]/50 backdrop-blur-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </button>

              <span className="mx-1 text-[var(--border-color)]">|</span>

              <div className="flex items-center bg-[var(--bg-secondary)]/80 backdrop-blur-sm rounded-lg p-0.5 border border-[var(--border-color)]">
                <SelectWithChevron
                  value={resolution}
                  onChange={(value) => setResolution(value)}
                  options={[
                    { value: '4K', label: '4K' },
                    { value: '2K', label: '2K' },
                    { value: '1K', label: '1K' }
                  ]}
                />
                <div className="w-[1px] h-3 bg-[var(--border-color)]" />
                <SelectWithChevron
                  value={aspectRatio}
                  onChange={(value) => setAspectRatio(value)}
                  options={[
                    { value: 'auto', label: 'AUTO' },
                    { value: '1:1', label: '1:1' },
                    { value: '3:4', label: '3:4' },
                    { value: '4:3', label: '4:3' },
                    { value: '16:9', label: '16:9' },
                    { value: '9:16', label: '9:16' }
                  ]}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className={[
                'pointer-events-auto flex items-center justify-center w-10 h-10 rounded-xl transition-all active:scale-95',
                canSend
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 shadow-md'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed shadow-none'
              ].join(' ')}
              aria-label="Send"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {variant !== 'floating' && (
        <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
          支持拖拽、粘贴图片 | Shift+Enter 换行
        </p>
      )}
    </div>
  )
}

function SelectWithChevron({
  value,
  options,
  onChange
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent pl-2 pr-5 py-1 text-[12px] font-bold text-[var(--text-tertiary)] cursor-pointer focus:outline-none focus-visible:outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-tertiary)] opacity-70">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  )
}
