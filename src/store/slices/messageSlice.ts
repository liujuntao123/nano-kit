import type { StateCreator } from 'zustand'
import type { Message } from '../../types'
import type { AppState } from '../appStore'
import * as db from '../../utils/db'

export interface MessageSlice {
  messages: Message[]
  saveMessage: (
    sessionId: number,
    role: 'user' | 'bot',
    content: string,
    images?: string[],
    rawHtml?: string | null
  ) => Promise<number>
  deleteMessage: (messageId: number) => Promise<void>
}

export const createMessageSlice: StateCreator<AppState, [], [], MessageSlice> = (set, get) => ({
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
  }
})
