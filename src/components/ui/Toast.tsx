import { useAppStore } from '../../store/appStore'

export default function Toast() {
  const { toast } = useAppStore()

  if (!toast.visible) return null

  const typeStyles = {
    default: 'bg-[var(--ink)] text-[var(--paper)]',
    success: 'bg-[var(--success-color)] text-[var(--paper)]',
    error: 'bg-[var(--danger-color)] text-[var(--paper)]',
    warning: 'bg-[var(--warning-color)] text-[var(--paper)]',
    info: 'bg-[var(--link-color)] text-[var(--paper)]'
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-slideUp">
      <div className={`px-4 py-2 rounded-xl border border-[var(--border-color)] shadow-[var(--shadow)] backdrop-blur-sm ${typeStyles[toast.type]}`}>
        {toast.message}
      </div>
    </div>
  )
}
