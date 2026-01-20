import LeftSidebar from './layout/LeftSidebar'
import MobileHeader from './layout/MobileHeader'
import DesktopHeader from './layout/DesktopHeader'
import { PageHeaderProvider } from './layout/PageHeaderContext'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import GeneratePage from '../pages/GeneratePage'
import SettingsPage from '../pages/SettingsPage'
import BananaModal from './modals/BananaModal'
import ArticleIllustrationPage from '../pages/ArticleIllustrationPage'
import XHSImagesPage from '../pages/XHSImagesPage'
import InfographicPage from '../pages/InfographicPage'
import MyPromptsPage from '../pages/MyPromptsPage'
import ImageEditorPage from '../pages/ImageEditorPage'

export default function Layout() {
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
            <Routes>
              <Route path="/" element={<GeneratePage />} />
              <Route path="/records" element={<HomePage />} />
              <Route path="/create" element={<GeneratePage />} />
              <Route path="/article-images" element={<ArticleIllustrationPage />} />
              <Route path="/xhs-images" element={<XHSImagesPage />} />
              <Route path="/infographic" element={<InfographicPage />} />
              <Route path="/prompts" element={<MyPromptsPage />} />
              <Route path="/editor" element={<ImageEditorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageHeaderProvider>
        </main>
      </div>

      {/* Modals */}
      <BananaModal />
    </div>
  )
}
