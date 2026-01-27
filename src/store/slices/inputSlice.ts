import type { StateCreator } from 'zustand'
import type { ImageState } from '../../types'
import type { AppState } from '../appStore'

export interface InputSlice {
  inputImages: ImageState[]
  resolution: string
  aspectRatio: string
  addInputImage: (image: ImageState) => void
  removeInputImage: (index: number) => void
  clearInputImages: () => void
  setResolution: (res: string) => void
  setAspectRatio: (ratio: string) => void
  pendingInputText: string | null
  setPendingInputText: (text: string | null) => void
}

export const createInputSlice: StateCreator<AppState, [], [], InputSlice> = (set, get) => ({
  inputImages: [],
  resolution: '2K',
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
  pendingInputText: null,
  setPendingInputText: (text) => set({ pendingInputText: text })
})
