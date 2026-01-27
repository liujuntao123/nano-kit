import type { StateCreator } from 'zustand'
import type { Session, Message } from '../../types'
import type { AppState } from '../appStore'
import * as db from '../../utils/db'

export interface SessionSlice {
  sessions: Session[]
  currentSessionId: number | null
  activeGenerations: Set<number>
  galleryRefreshKey: number
  bumpGalleryRefreshKey: () => void
  dbReady: boolean
  dbInitializing: boolean
  dbError: string | null
  initDB: () => Promise<void>
  retryInitDB: () => Promise<void>
  resetDB: () => Promise<void>
  loadSessions: () => Promise<void>
  loadSession: (sessionId: number) => Promise<Message[]>
  createSession: (title?: string) => Promise<number>
  deleteSession: (sessionId: number) => Promise<void>
  updateSessionTitle: (sessionId: number, title: string) => Promise<void>
  clearAllSessions: () => Promise<void>
  addActiveGeneration: (sessionId: number) => void
  removeActiveGeneration: (sessionId: number) => void
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return '未知错误'
}

export const createSessionSlice: StateCreator<AppState, [], [], SessionSlice> = (set, get) => {
  let initPromise: Promise<void> | null = null

  db.setDBBlockedHandler(() => {
    if (!get().dbInitializing) return
    initPromise = null
    set({
      dbInitializing: false,
      dbError: '数据库被其他页面占用，请关闭后重试。'
    })
    get().showToast('数据库被占用，请关闭其他页面后重试', 'warning', 3000)
  })

  const startInit = async () => {
    set({ dbInitializing: true, dbError: null })

    try {
      await db.initDB()
      await get().loadSessions()
      const sessions = get().sessions
      if (sessions.length > 0) {
        await get().loadSession(sessions[0].id)
      } else {
        await get().createSession()
      }
      set({ dbReady: true, dbError: null })
    } catch (error) {
      const message = getErrorMessage(error)
      set({ dbReady: false, dbError: message })
      get().showToast('数据库初始化失败', 'error', 3000)
    } finally {
      set({ dbInitializing: false })
      initPromise = null
    }
  }

  return {
    sessions: [],
    currentSessionId: null,
    activeGenerations: new Set(),
    galleryRefreshKey: 0,
    bumpGalleryRefreshKey: () => set(state => ({ galleryRefreshKey: state.galleryRefreshKey + 1 })),
    dbReady: false,
    dbInitializing: false,
    dbError: null,
    initDB: async () => {
      if (initPromise) return initPromise
      initPromise = startInit()
      return initPromise
    },
    retryInitDB: async () => {
      initPromise = null
      await get().initDB()
    },
    resetDB: async () => {
      try {
        await db.resetDB()
        set({ sessions: [], currentSessionId: null, dbReady: false, dbError: null })
      } catch (error) {
        console.error('Failed to reset DB:', error)
        get().showToast('清空本地数据失败', 'error')
      }
      initPromise = null
      await get().initDB()
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
      const { sessions, showLoading, hideLoading, showToast } = get()
      showLoading('正在清理对话记录...')
      try {
        for (const session of sessions) {
          await db.deleteSession(session.id)
        }
        await get().createSession()
        get().bumpGalleryRefreshKey()
        showToast('已清除全部对话记录', 'success')
      } catch (error) {
        console.error('Failed to clear sessions:', error)
        showToast('清除失败', 'error')
      } finally {
        hideLoading()
      }
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
    }
  }
}
