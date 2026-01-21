import { useAppStore } from '../../store/appStore'

export default function ConfirmDialog() {
  const { confirmDialog, hideConfirm } = useAppStore()
  const { visible, title, message, confirmText, cancelText, onConfirm, onCancel, type } = confirmDialog

  if (!visible) return null

  const handleConfirm = () => {
    onConfirm?.()
    hideConfirm()
  }

  const handleCancel = () => {
    onCancel?.()
    hideConfirm()
  }

  const confirmButtonClass = type === 'danger'
    ? 'bg-red-500 hover:bg-red-600 text-white'
    : 'bg-[var(--accent-color)] hover:opacity-90 text-white'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(20,20,19,0.45)] backdrop-blur-sm animate-fadeIn"
        onClick={handleCancel}
      />
      <div className="relative bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-[var(--shadow)] w-full max-w-sm animate-slideUp">
        <div className="p-6">
          {title && (
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {title}
            </h3>
          )}
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex border-t border-[var(--border-color)]">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors rounded-bl-2xl"
          >
            {cancelText}
          </button>
          <div className="w-px bg-[var(--border-color)]" />
          <button
            onClick={handleConfirm}
            className={`flex-1 py-3 text-sm font-medium transition-colors rounded-br-2xl ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
