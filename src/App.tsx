import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Layout from './components/Layout'
import Toast from './components/ui/Toast'
import Lightbox from './components/ui/Lightbox'
import GlobalLoading from './components/ui/GlobalLoading'

function App() {
  const { theme, initTheme, initProviders, initDB } = useAppStore()

  useEffect(() => {
    const updateAppHeight = () => {
      const height = window.visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${Math.round(height)}px`)
    }

    updateAppHeight()

    window.addEventListener('resize', updateAppHeight)
    window.visualViewport?.addEventListener('resize', updateAppHeight)
    window.visualViewport?.addEventListener('scroll', updateAppHeight)
    return () => {
      window.removeEventListener('resize', updateAppHeight)
      window.visualViewport?.removeEventListener('resize', updateAppHeight)
      window.visualViewport?.removeEventListener('scroll', updateAppHeight)
    }
  }, [])

  useEffect(() => {
    initTheme()
    initProviders()
  }, [initTheme, initProviders])

  useEffect(() => {
    initDB()
  }, [initDB])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="h-[var(--app-height)] w-screen overflow-hidden">
      <Layout />
      <Toast />
      <Lightbox />
      <GlobalLoading />
    </div>
  )
}

export default App
