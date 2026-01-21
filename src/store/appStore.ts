import { create } from 'zustand'
import type { Provider, Session, Message, ImageState, ToastState, ToastType } from '../types'
import * as db from '../utils/db'

interface ConfirmDialogState {
  visible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  type: 'default' | 'danger'
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
}

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger'
  onConfirm?: () => void
  onCancel?: () => void
}

interface AppState {
  // Theme
  theme: 'light' | 'dark'
  initTheme: () => void
  toggleTheme: () => void

  // Toast
  toast: ToastState
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: () => void

  // Confirm Dialog
  confirmDialog: ConfirmDialogState
  showConfirm: (options: ConfirmOptions) => void
  hideConfirm: () => void

  // Lightbox
  lightboxImage: string | null
  openLightbox: (src: string) => void
  closeLightbox: () => void

  // Global Loading
  globalLoading: { visible: boolean; text: string }
  showLoading: (text?: string) => void
  hideLoading: () => void
  updateLoadingText: (text: string) => void

  // Sidebars
  leftSidebarOpen: boolean
  toggleLeftSidebar: () => void
  closeAllSidebars: () => void

  // Providers
  providers: Provider[]
  activeProviderId: string
  activeTextProviderId: string
  initProviders: () => void
  saveProvider: (provider: Omit<Provider, 'id'> & { id?: string }) => string
  deleteProvider: (id: string) => void
  setActiveProvider: (id: string) => void
  setActiveTextProvider: (id: string) => void
  getActiveConfig: (capability?: 'image' | 'text') => Provider | null

  // Sessions
  sessions: Session[]
  currentSessionId: number | null
  activeGenerations: Set<number>

  // Gallery
  galleryRefreshKey: number
  bumpGalleryRefreshKey: () => void
  initDB: () => Promise<void>
  loadSessions: () => Promise<void>
  loadSession: (sessionId: number) => Promise<Message[]>
  createSession: (title?: string) => Promise<number>
  deleteSession: (sessionId: number) => Promise<void>
  updateSessionTitle: (sessionId: number, title: string) => Promise<void>
  clearAllSessions: () => Promise<void>
  addActiveGeneration: (sessionId: number) => void
  removeActiveGeneration: (sessionId: number) => void

  // Messages
  messages: Message[]
  saveMessage: (sessionId: number, role: 'user' | 'bot', content: string, images?: string[], rawHtml?: string | null) => Promise<number>
  deleteMessage: (messageId: number) => Promise<void>

  // Input state
  inputImages: ImageState[]
  resolution: string
  aspectRatio: string
  addInputImage: (image: ImageState) => void
  removeInputImage: (index: number) => void
  clearInputImages: () => void
  setResolution: (res: string) => void
  setAspectRatio: (ratio: string) => void

  bananaModalOpen: boolean
  slicerImageUrl: string | null
  openBananaModal: () => void
  closeBananaModal: () => void
  openSlicerModal: (imageUrl?: string) => void
  closeSlicerModal: () => void

  // Pending input text (for filling from modals)
  pendingInputText: string | null
  setPendingInputText: (text: string | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: 'light',
  initTheme: () => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    set({ theme: saved || 'light' })
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    set({ theme: newTheme })
    get().showToast(newTheme === 'dark' ? '已切换到暗黑模式' : '已切换到明亮模式', 'success')
  },

  // Toast
  toast: { message: '', type: 'default', visible: false, duration: 2000 },
  showToast: (message, type = 'default', duration = 2000) => {
    set({ toast: { message, type, visible: true, duration } })
    setTimeout(() => get().hideToast(), duration)
  },
  hideToast: () => {
    set(state => ({ toast: { ...state.toast, visible: false } }))
  },

  // Confirm Dialog
  confirmDialog: {
    visible: false,
    title: '',
    message: '',
    confirmText: '确定',
    cancelText: '取消',
    type: 'default',
    onConfirm: null,
    onCancel: null
  },
  showConfirm: (options) => {
    set({
      confirmDialog: {
        visible: true,
        title: options.title || '',
        message: options.message,
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        type: options.type || 'default',
        onConfirm: options.onConfirm || null,
        onCancel: options.onCancel || null
      }
    })
  },
  hideConfirm: () => {
    set(state => ({
      confirmDialog: { ...state.confirmDialog, visible: false, onConfirm: null, onCancel: null }
    }))
  },

  // Lightbox
  lightboxImage: null,
  openLightbox: (src) => set({ lightboxImage: src }),
  closeLightbox: () => set({ lightboxImage: null }),

  // Global Loading
  globalLoading: { visible: false, text: '加载中...' },
  showLoading: (text = '加载中...') => set({ globalLoading: { visible: true, text } }),
  hideLoading: () => set({ globalLoading: { visible: false, text: '加载中...' } }),
  updateLoadingText: (text) => set(state => ({ globalLoading: { ...state.globalLoading, text } })),

  // Sidebars
  leftSidebarOpen: false,
  toggleLeftSidebar: () => set(state => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  closeAllSidebars: () => set({ leftSidebarOpen: false }),

  // Providers
  providers: [],
  activeProviderId: '',
  activeTextProviderId: '',
  initProviders: () => {
    try {
      const ACTIVE_TEXT_PROVIDER_KEY = 'gemini_active_text_provider'

      const rawProviders = JSON.parse(localStorage.getItem('gemini_providers') || '[]')
      let providers: Provider[] = Array.isArray(rawProviders) ? rawProviders : []
      let didMutate = false

      providers = providers
        .filter(p => p && typeof p === 'object')
        .map((p: any) => {
          const caps = {
            image: p.capabilities?.image ?? true,
            text: p.capabilities?.text ?? false
          }

          if (!p.capabilities) didMutate = true
          if (p.imageModel === undefined || p.textModel === undefined) didMutate = true
          if (p.model !== undefined) didMutate = true

          const legacyModel = typeof p.model === 'string' ? p.model : ''
          let imageModel = typeof p.imageModel === 'string' ? p.imageModel : ''
          let textModel = typeof p.textModel === 'string' ? p.textModel : ''

          if (!imageModel && legacyModel && caps.image) imageModel = legacyModel
          if (!textModel && legacyModel && caps.text) textModel = legacyModel

          // Drop legacy `model` field when normalizing provider configs.
          const { model: _legacyModel, ...rest } = p
          return {
            ...rest,
            imageModel,
            textModel,
            capabilities: caps
          } as Provider
        })

      let activeId = localStorage.getItem('gemini_active_provider') || ''
      let activeTextId = localStorage.getItem(ACTIVE_TEXT_PROVIDER_KEY) || ''

      // Migrate old config
      const oldHost = localStorage.getItem('api-host')
      if (oldHost && providers.length === 0) {
        providers.push({
          id: 'legacy_' + Date.now(),
          name: '默认渠道',
          type: 'gemini',
          host: oldHost,
          key: localStorage.getItem('api-key') || '',
          textModel: '',
          imageModel: localStorage.getItem('model-name') || 'gemini-3-pro-image-preview',
          capabilities: { image: true, text: false }
        })
        didMutate = true
      }

      const defaultImageId = providers.find(p => p.capabilities?.image)?.id || ''
      const defaultTextId = providers.find(p => p.capabilities?.text)?.id || ''

      // Normalize active selections: ensure they point to an existing provider with the capability.
      if (!activeId || !providers.find(p => p.id === activeId && p.capabilities?.image)) {
        activeId = defaultImageId
      }
      if (!activeTextId || !providers.find(p => p.id === activeTextId && p.capabilities?.text)) {
        activeTextId = defaultTextId
      }

      localStorage.setItem('gemini_active_provider', activeId)
      localStorage.setItem(ACTIVE_TEXT_PROVIDER_KEY, activeTextId)

      if (didMutate) {
        localStorage.setItem('gemini_providers', JSON.stringify(providers))
      }

      set({ providers, activeProviderId: activeId, activeTextProviderId: activeTextId })
    } catch (e) {
      console.error('Failed to init providers:', e)
      set({ providers: [], activeProviderId: '', activeTextProviderId: '' })
    }
  },
  saveProvider: (provider) => {
    const { providers } = get()
    const id = provider.id || 'p_' + Date.now()
    const caps = {
      image: provider.capabilities?.image ?? true,
      text: provider.capabilities?.text ?? false
    }
    const legacyModel = (provider as any)?.model
    const textModel = provider.textModel || (caps.text ? legacyModel : '') || ''
    const imageModel = provider.imageModel || (caps.image ? legacyModel : '') || ''

    const { model: _legacyModel, ...rest } = provider as any
    const newProvider: Provider = {
      ...rest,
      id,
      capabilities: caps,
      textModel,
      imageModel
    }

    let newProviders: Provider[]
    const existingIndex = providers.findIndex(p => p.id === id)
    if (existingIndex > -1) {
      newProviders = [...providers]
      newProviders[existingIndex] = newProvider as Provider
    } else {
      newProviders = [...providers, newProvider as Provider]
    }

    localStorage.setItem('gemini_providers', JSON.stringify(newProviders))
    set({ providers: newProviders })
    get().showToast('渠道已保存', 'success')
    return id
  },
  deleteProvider: (id) => {
    const { providers, activeProviderId, activeTextProviderId } = get()
    const newProviders = providers.filter(p => p.id !== id)
    localStorage.setItem('gemini_providers', JSON.stringify(newProviders))

    const pickFirst = (capability: 'image' | 'text') =>
      newProviders.find(p => (capability === 'image' ? p.capabilities?.image : p.capabilities?.text))?.id || ''

    let newActiveId = activeProviderId === id ? pickFirst('image') : activeProviderId
    if (newActiveId && !newProviders.find(p => p.id === newActiveId && p.capabilities?.image)) {
      newActiveId = pickFirst('image')
    }
    localStorage.setItem('gemini_active_provider', newActiveId)

    let newActiveTextId = activeTextProviderId === id ? pickFirst('text') : activeTextProviderId
    if (newActiveTextId && !newProviders.find(p => p.id === newActiveTextId && p.capabilities?.text)) {
      newActiveTextId = pickFirst('text')
    }
    localStorage.setItem('gemini_active_text_provider', newActiveTextId)

    set({ providers: newProviders, activeProviderId: newActiveId, activeTextProviderId: newActiveTextId })
    get().showToast('渠道已删除', 'success')
  },
  setActiveProvider: (id) => {
    localStorage.setItem('gemini_active_provider', id)
    set({ activeProviderId: id })
  },
  setActiveTextProvider: (id) => {
    localStorage.setItem('gemini_active_text_provider', id)
    set({ activeTextProviderId: id })
  },
  getActiveConfig: (capability = 'image') => {
    const { providers, activeProviderId, activeTextProviderId } = get()
    if (providers.length === 0) return null

    const pool = providers.filter(p => capability === 'image' ? p.capabilities?.image : p.capabilities?.text)
    if (pool.length === 0) return null

    const activeId = capability === 'image' ? activeProviderId : activeTextProviderId
    return pool.find(p => p.id === activeId) || pool[0] || null
  },

  // Sessions
  sessions: [],
  currentSessionId: null,
  activeGenerations: new Set(),
  galleryRefreshKey: 0,
  bumpGalleryRefreshKey: () => set(state => ({ galleryRefreshKey: state.galleryRefreshKey + 1 })),
  initDB: async () => {
    await db.initDB()
    await get().loadSessions()
    const sessions = get().sessions
    if (sessions.length > 0) {
      await get().loadSession(sessions[0].id)
    } else {
      await get().createSession()
    }
    get().initProviders()
  },
  loadSessions: async () => {
    const sessions = await db.getAllSessions()
    set({ sessions })
  },
  loadSession: async (sessionId) => {
    const messages = await db.getSessionMessages(sessionId)
    set({ currentSessionId: sessionId, messages })
    get().closeAllSidebars()
    return messages
  },
  createSession: async (title = '新对话') => {
    const id = await db.createSession(title)
    await get().loadSessions()
    await get().loadSession(id)
    return id
  },
  deleteSession: async (sessionId) => {
    await db.deleteSession(sessionId)
    const { currentSessionId } = get()
    await get().loadSessions()

    if (sessionId === currentSessionId) {
      const sessions = get().sessions
      if (sessions.length > 0) {
        await get().loadSession(sessions[0].id)
      } else {
        await get().createSession()
      }
    }
  },
  updateSessionTitle: async (sessionId, title) => {
    await db.updateSessionTitle(sessionId, title)
    await get().loadSessions()
  },
  clearAllSessions: async () => {
    const sessions = get().sessions
    for (const session of sessions) {
      await db.deleteSession(session.id)
    }
    await get().createSession()
    get().bumpGalleryRefreshKey()
    get().showToast('已清除全部对话记录', 'success')
  },
  addActiveGeneration: (sessionId) => {
    set(state => ({
      activeGenerations: new Set([...state.activeGenerations, sessionId])
    }))
  },
  removeActiveGeneration: (sessionId) => {
    set(state => {
      const newSet = new Set(state.activeGenerations)
      newSet.delete(sessionId)
      return { activeGenerations: newSet }
    })
  },

  // Messages
  messages: [],
  saveMessage: async (sessionId, role, content, images = [], rawHtml = null) => {
    const id = await db.saveMessage(sessionId, role, content, images, rawHtml)
    const messages = await db.getSessionMessages(sessionId)
    set({ messages })
    return id
  },
  deleteMessage: async (messageId) => {
    await db.deleteMessage(messageId)
    const { currentSessionId } = get()
    if (currentSessionId) {
      const messages = await db.getSessionMessages(currentSessionId)
      set({ messages })
    }
    get().showToast('消息已删除', 'success')
  },

  // Input state
  inputImages: [],
  resolution: '4K',
  aspectRatio: 'auto',
  addInputImage: (image) => {
    set(state => {
      if (state.inputImages.length >= 14) {
        get().showToast('最多14张图片', 'warning')
        return state
      }
      return { inputImages: [...state.inputImages, image] }
    })
  },
  removeInputImage: (index) => {
    set(state => ({
      inputImages: state.inputImages.filter((_, i) => i !== index)
    }))
  },
  clearInputImages: () => set({ inputImages: [] }),
  setResolution: (res) => set({ resolution: res }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

  // Overlays
  bananaModalOpen: false,
  slicerImageUrl: null,
  openBananaModal: () => {
    get().closeAllSidebars()
    set({ bananaModalOpen: true })
  },
  closeBananaModal: () => set({ bananaModalOpen: false }),
  openSlicerModal: (imageUrl) => {
    get().closeAllSidebars()
    set({ slicerImageUrl: imageUrl || null })
  },
  closeSlicerModal: () => set({ slicerImageUrl: null }),

  // Pending input text
  pendingInputText: null,
  setPendingInputText: (text) => set({ pendingInputText: text })
}))
