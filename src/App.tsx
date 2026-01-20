import { useEffect } from 'react'
import { useAppStore } from './store/appStore'
import Layout from './components/Layout'
import Toast from './components/ui/Toast'
import Lightbox from './components/ui/Lightbox'
import GlobalLoading from './components/ui/GlobalLoading'

function App() {
  const { theme, initTheme, initDB } = useAppStore()

  useEffect(() => {
    initTheme()
    initDB()
  }, [initTheme, initDB])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Layout />
      <Toast />
      <Lightbox />
      <GlobalLoading />
    </div>
  )
}

export default App
