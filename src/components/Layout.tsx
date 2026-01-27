import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import LeftSidebar from './layout/LeftSidebar'
import MobileHeader from './layout/MobileHeader'
import DesktopHeader from './layout/DesktopHeader'
import { PageHeaderProvider } from './layout/PageHeaderContext'
import BananaModal from './modals/BananaModal'
import ConfirmDialog from './ui/ConfirmDialog'

const HomePage = lazy(() => import('../pages/HomePage'))
const GeneratePage = lazy(() => import('../pages/GeneratePage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const ArticleIllustrationPage = lazy(() => import('../pages/ArticleIllustrationPage'))
const XHSImagesPage = lazy(() => import('../pages/XHSImagesPage'))
const InfographicPage = lazy(() => import('../pages/InfographicPage'))
const MyPromptsPage = lazy(() => import('../pages/MyPromptsPage'))
const ImageEditorPage = lazy(() => import('../pages/ImageEditorPage'))

export default function Layout() {
  const { dbReady, dbInitializing, dbError, retryInitDB, resetDB } = useAppStore()

  return (
    <div className="h-screen flex flex-col text-[var(--text-primary)]">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Routed Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <PageHeaderProvider>
            <DesktopHeader />
            <div className="flex-1 overflow-hidden">
              {dbReady ? (
                <Suspense fallback={<PageFallback text="页面加载中..." />}>
                  <Routes>
                    <Route path="/" element={<GeneratePage />} />
                    <Route path="/records" element={<HomePage />} />
                    <Route path="/article-images" element={<ArticleIllustrationPage />} />
                    <Route path="/xhs-images" element={<XHSImagesPage />} />
                    <Route path="/infographic" element={<InfographicPage />} />
                    <Route path="/prompts" element={<MyPromptsPage />} />
                    <Route path="/editor" element={<ImageEditorPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              ) : (
                <DbGate
                  dbInitializing={dbInitializing}
                  dbError={dbError}
                  onRetry={retryInitDB}
                  onReset={resetDB}
                />
              )}
            </div>
          </PageHeaderProvider>
        </main>
      </div>

      {/* Modals */}
      <BananaModal />
      <ConfirmDialog />
    </div>
  )
}

function PageFallback({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-[var(--text-tertiary)]">
      <div className="loading-spinner mr-2" />
      {text}
    </div>
  )
}

function DbGate({
  dbInitializing,
  dbError,
  onRetry,
  onReset
}: {
  dbInitializing: boolean
  dbError: string | null
  onRetry: () => void
  onReset: () => void
}) {
  if (!dbError) {
    return <PageFallback text="正在初始化本地数据库..." />
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">本地数据库初始化失败</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4 break-words">
          {dbError}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRetry}
            disabled={dbInitializing}
            className="px-4 py-2 rounded-xl bg-[var(--accent-color)] text-white text-sm shadow-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
          >
            重试
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={dbInitializing}
            className="px-4 py-2 rounded-xl bg-[var(--danger-color)] text-white text-sm shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            清空本地数据
          </button>
        </div>
      </div>
    </div>
  )
}
