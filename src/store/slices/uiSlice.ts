import type { StateCreator } from 'zustand'
import type { ToastState, ToastType } from '../../types'
import type { AppState } from '../appStore'
import { safeStorageGet, scheduleStorageWrite } from '../utils/storage'

export interface ConfirmDialogState {
  visible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  type: 'default' | 'danger'
  onConfirm: (() => void) | null
  onCancel: (() => void) | null
}

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger'
  onConfirm?: () => void
  onCancel?: () => void
}

export interface UISlice {
  theme: 'light' | 'dark'
  initTheme: () => void
  toggleTheme: () => void
  toast: ToastState
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: () => void
  confirmDialog: ConfirmDialogState
  showConfirm: (options: ConfirmOptions) => void
  hideConfirm: () => void
  lightboxImage: string | null
  openLightbox: (src: string) => void
  closeLightbox: () => void
  globalLoading: { visible: boolean; text: string }
  showLoading: (text?: string) => void
  hideLoading: () => void
  updateLoadingText: (text: string) => void
  leftSidebarOpen: boolean
  toggleLeftSidebar: () => void
  closeAllSidebars: () => void
}

const getStoredTheme = () => {
  const saved = safeStorageGet('theme')
  return saved === 'dark' || saved === 'light' ? saved : 'light'
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
  theme: getStoredTheme(),
  initTheme: () => {
    set({ theme: getStoredTheme() })
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    scheduleStorageWrite('theme', newTheme)
    set({ theme: newTheme })
    get().showToast(newTheme === 'dark' ? '已切换到暗黑模式' : '已切换到明亮模式', 'success')
  },

  toast: { message: '', type: 'default', visible: false, duration: 2000 },
  showToast: (message, type = 'default', duration = 2000) => {
    set({ toast: { message, type, visible: true, duration } })
    setTimeout(() => get().hideToast(), duration)
  },
  hideToast: () => {
    set(state => ({ toast: { ...state.toast, visible: false } }))
  },

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

  lightboxImage: null,
  openLightbox: (src) => set({ lightboxImage: src }),
  closeLightbox: () => set({ lightboxImage: null }),

  globalLoading: { visible: false, text: '加载中...' },
  showLoading: (text = '加载中...') => set({ globalLoading: { visible: true, text } }),
  hideLoading: () => set({ globalLoading: { visible: false, text: '加载中...' } }),
  updateLoadingText: (text) => set(state => ({ globalLoading: { ...state.globalLoading, text } })),

  leftSidebarOpen: false,
  toggleLeftSidebar: () => set(state => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  closeAllSidebars: () => set({ leftSidebarOpen: false })
})
