import { useAppStore } from '../../store/appStore'

export default function Lightbox() {
  const { lightboxImage, closeLightbox } = useAppStore()

  if (!lightboxImage) return null

  return (
    <div
      className="fixed inset-0 z-[150] bg-[rgba(20,20,19,0.92)] flex items-center justify-center cursor-pointer animate-fadeIn"
      onClick={closeLightbox}
    >
      <button
        className="absolute top-4 right-4 text-[var(--paper)] w-12 h-12 rounded-xl flex items-center justify-center text-4xl leading-none hover:bg-white/10 transition-colors"
        onClick={closeLightbox}
        aria-label="关闭预览"
      >
        &times;
      </button>
      <img
        src={lightboxImage}
        alt="Preview"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
