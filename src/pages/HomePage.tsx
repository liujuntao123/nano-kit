import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import GalleryMasonry from '../components/gallery/GalleryMasonry'
import { useAppStore } from '../store/appStore'
import { usePageHeader } from '../components/layout/PageHeaderContext'

export default function HomePage() {
  const { bumpGalleryRefreshKey, clearAllSessions, showConfirm } = useAppStore()
  const { setHeader } = usePageHeader()
  const [count, setCount] = useState(0)

  const titleSuffix = useMemo(() => (count > 0 ? `（${count}）` : ''), [count])
  const headerActions = useMemo(() => (
    <>
      <div className="relative group">
        <button
          onClick={() => bumpGalleryRefreshKey()}
          className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          刷新
        </span>
      </div>
      <div className="relative group">
        <button
          onClick={() => {
            showConfirm({
              title: '清空全部作品',
              message: '确定要清空全部作品吗？此操作不可恢复！',
              type: 'danger',
              onConfirm: () => clearAllSessions()
            })
          }}
          className="p-2 rounded-xl bg-[var(--danger-color)] text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          清空全部
        </span>
      </div>
      <div className="relative group">
        <Link
          to="/create"
          className="p-2 rounded-xl bg-[var(--accent-color)] text-white shadow-sm hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          去创作
        </span>
      </div>
    </>
  ), [bumpGalleryRefreshKey, clearAllSessions])

  useEffect(() => {
    setHeader({
      title: `作品管理${titleSuffix}`,
      description: '所有生成图片与提示词',
      actions: headerActions
    })
    return () => setHeader(null)
  }, [setHeader, titleSuffix, headerActions])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-start justify-between gap-3 mb-4 lg:hidden">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">作品管理{titleSuffix}</h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-1 font-serif">瀑布流展示所有生成图片与提示词</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <button
                onClick={() => bumpGalleryRefreshKey()}
                className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                刷新
              </span>
            </div>
            <div className="relative group">
              <button
                onClick={() => {
                  showConfirm({
                    title: '清空全部作品',
                    message: '确定要清空全部作品吗？此操作不可恢复！',
                    type: 'danger',
                    onConfirm: () => clearAllSessions()
                  })
                }}
                className="p-2 rounded-xl bg-[var(--danger-color)] text-white shadow-sm hover:opacity-90 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                清空全部
              </span>
            </div>
            <div className="relative group">
              <Link
                to="/create"
                className="p-2 rounded-xl bg-[var(--accent-color)] text-white shadow-sm hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                去创作
              </span>
            </div>
          </div>
        </div>

        <GalleryMasonry onCountChange={setCount} />
      </div>
    </div>
  )
}
