type StorageWrite = {
  key: string
  value: string
  onError?: (error: unknown) => void
}

const pendingWrites = new Map<string, StorageWrite>()
let flushHandle: number | null = null

const scheduleIdle = (cb: () => void) => {
  if (typeof window === 'undefined') {
    return setTimeout(cb, 0)
  }

  const w = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  }

  if (typeof w.requestIdleCallback === 'function') {
    return w.requestIdleCallback(() => cb(), { timeout: 1000 })
  }

  return window.setTimeout(cb, 0)
}

const flushWrites = () => {
  flushHandle = null
  const writes = Array.from(pendingWrites.values())
  pendingWrites.clear()

  for (const write of writes) {
    try {
      localStorage.setItem(write.key, write.value)
    } catch (error) {
      write.onError?.(error)
    }
  }
}

export const scheduleStorageWrite = (key: string, value: string, onError?: (error: unknown) => void) => {
  pendingWrites.set(key, { key, value, onError })
  if (flushHandle !== null) return
  flushHandle = scheduleIdle(flushWrites)
}

export const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
