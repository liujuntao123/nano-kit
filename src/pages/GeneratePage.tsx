import ChatInput from '../components/chat/ChatInput'
import GalleryMasonry from '../components/gallery/GalleryMasonry'

export default function GeneratePage() {
  return (
    <div className="h-full relative">
      {/* Background gallery */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4">
          <GalleryMasonry contentPaddingBottomClassName="pb-[calc(20rem+env(safe-area-inset-bottom))]" />
        </div>
      </div>

      {/* Bottom composer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-[calc(3rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-[var(--bg-primary)] to-transparent">
        <div className="max-w-3xl mx-auto">
          <ChatInput variant="floating" />
        </div>
      </div>
    </div>
  )
}
