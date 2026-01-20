import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/appStore'
import MessageItem from './MessageItem'
import ChatInput from './ChatInput'
import { LogoMark } from '../ui/Logo'

export default function ChatArea() {
  const { messages } = useAppStore()
  const chatHistoryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [messages])

  const isEmpty = messages.length === 0

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat History */}
      <div
        ref={chatHistoryRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageItem key={msg.id || msg.timestamp} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput />
      </div>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()
  const { openBananaModal, createSession } = useAppStore()

  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-4">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center shadow-sm">
          <LogoMark className="w-10 h-10 text-[var(--text-primary)]" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight lowercase mb-2">nano kit</h1>
        <p className="text-[var(--text-secondary)] font-serif">
          输入提示词开始创作，支持图片参考
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full">
        <QuickAction
          icon={<ImageIcon />}
          title="生成图片"
          desc="输入描述生成图片"
          onClick={() => navigate('/create')}
        />
        <QuickAction
          icon={<BookIcon />}
          title="提示词库"
          desc="浏览精选提示词"
          onClick={openBananaModal}
        />
        <QuickAction
          icon={<XHSIcon />}
          title="文章配图"
          desc="从文章提取配图提示词"
          onClick={() => navigate('/article-images')}
        />
        <QuickAction
          icon={<StickerIcon />}
          title="表情包模式"
          desc="快速制作表情包"
          onClick={() => {
            createSession('表情包制作')
          }}
        />
      </div>
    </div>
  )
}

function QuickAction({ icon, title, desc, onClick }: {
  icon: React.ReactNode
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)]
                 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors text-left"
    >
      <div className="text-[var(--link-color)]">{icon}</div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-[var(--text-tertiary)]">{desc}</div>
      </div>
    </button>
  )
}

// Icons
function ImageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function XHSIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function StickerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  )
}
