// Provider types
export interface ProviderCapabilities {
  image: boolean
  text: boolean
}

export interface Provider {
  id: string
  name: string
  type: 'gemini' | 'openai'
  host: string
  key: string
  textModel: string
  imageModel: string
  capabilities: ProviderCapabilities
}

// Session and Message types
export interface Session {
  id: number
  title: string
  timestamp: number
}

export interface Message {
  id?: number
  sessionId: number
  role: 'user' | 'bot'
  content: string
  images: string[]
  rawHtml: string | null
  timestamp: number
}

// Image state
export interface ImageState {
  base64: string
  mimeType: string
  preview: string
}

// Banana Prompt types
export interface BananaPrompt {
  title: string
  prompt: string
  preview: string
  category: string
  mode: 'generate' | 'edit'
  author?: string
  link?: string
}

// Custom Prompt types
export interface CustomPrompt {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  // Optional metadata when a prompt is saved from the Banana prompt library.
  category?: string
  mode?: 'generate' | 'edit'
  preview?: string
  author?: string
}

// Toast types
export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info'

export interface ToastState {
  message: string
  type: ToastType
  visible: boolean
  duration: number
}
