import type { StateCreator } from 'zustand'
import type { AppState } from '../appStore'

export interface ModalSlice {
  bananaModalOpen: boolean
  slicerImageUrl: string | null
  openBananaModal: () => void
  closeBananaModal: () => void
  openSlicerModal: (imageUrl?: string) => void
  closeSlicerModal: () => void
}

export const createModalSlice: StateCreator<AppState, [], [], ModalSlice> = (set, get) => ({
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
  closeSlicerModal: () => set({ slicerImageUrl: null })
})
