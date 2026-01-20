import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string
}

export default function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(20,20,19,0.45)] backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <div className={`relative bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow)] max-h-[90vh] overflow-hidden flex flex-col animate-slideUp ${className}`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg w-10 h-10 flex items-center justify-center text-2xl leading-none transition-colors"
              aria-label="关闭弹窗"
            >
              &times;
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
