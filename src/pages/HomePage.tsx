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
      <button
        onClick={() => bumpGalleryRefreshKey()}
        className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        刷新
      </button>
      <button
        onClick={() => {
          showConfirm({
            title: '清空全部作品',
            message: '确定要清空全部作品吗？此操作不可恢复！',
            type: 'danger',
            onConfirm: () => clearAllSessions()
          })
        }}
        className="px-3 py-2 rounded-xl bg-[var(--danger-color)] text-white text-sm shadow-sm hover:opacity-90 transition-opacity"
      >
        清空全部
      </button>
      <Link
        to="/create"
        className="px-3 py-2 rounded-xl bg-[var(--accent-color)] text-white text-sm shadow-sm hover:bg-[var(--accent-hover)] transition-colors"
      >
        去创作
      </Link>
    </>
  ), [bumpGalleryRefreshKey, clearAllSessions])

  useEffect(() => {
    setHeader({
      title: `作品管理${titleSuffix}`,
      description: '瀑布流展示所有生成图片与提示词',
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
            <button
              onClick={() => bumpGalleryRefreshKey()}
              className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm shadow-sm hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              刷新
            </button>
            <button
              onClick={() => {
                if (confirm('确定要清空全部作品吗？此操作不可恢复！')) {
                  clearAllSessions()
                }
              }}
              className="px-3 py-2 rounded-xl bg-[var(--danger-color)] text-white text-sm shadow-sm hover:opacity-90 transition-opacity"
            >
              清空全部
            </button>
            <Link
              to="/create"
              className="px-3 py-2 rounded-xl bg-[var(--accent-color)] text-white text-sm shadow-sm hover:bg-[var(--accent-hover)] transition-colors"
            >
              去创作
            </Link>
          </div>
        </div>

        <GalleryMasonry onCountChange={setCount} />
      </div>
    </div>
  )
}
