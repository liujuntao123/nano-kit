import { useAppStore } from '../../store/appStore'

export default function GlobalLoading() {
  const { globalLoading } = useAppStore()

  if (!globalLoading.visible) return null

  return (
    <div className="fixed inset-0 z-[180] bg-[rgba(20,20,19,0.45)] backdrop-blur-sm flex items-center justify-center animate-fadeIn">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-[var(--shadow)] flex flex-col items-center gap-4 animate-slideUp">
        <div className="loading-spinner w-10 h-10 border-4" />
        <p className="text-[var(--text-secondary)] font-serif">{globalLoading.text}</p>
      </div>
    </div>
  )
}
