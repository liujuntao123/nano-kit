import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Session, Message } from '../types'

interface GeminiDB extends DBSchema {
  sessions: {
    key: number
    value: Session
  }
  messages: {
    key: number
    value: Message
    indexes: { 'sessionId': number }
  }
}

const DB_NAME = 'GeminiProDB'
const DB_VERSION = 2

let db: IDBPDatabase<GeminiDB> | null = null

// Main DB functions
export async function initDB(): Promise<IDBPDatabase<GeminiDB>> {
  if (db) return db

  db = await openDB<GeminiDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('sessions')) {
        database.createObjectStore('sessions', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('messages')) {
        const msgStore = database.createObjectStore('messages', { keyPath: 'id', autoIncrement: true })
        msgStore.createIndex('sessionId', 'sessionId', { unique: false })
      }
    }
  })

  return db
}

export async function getAllSessions(): Promise<Session[]> {
  const database = await initDB()
  const sessions = await database.getAll('sessions')
  return sessions.sort((a, b) => b.id - a.id)
}

export async function getSessionMessages(sessionId: number): Promise<Message[]> {
  const database = await initDB()
  const messages = await database.getAllFromIndex('messages', 'sessionId', sessionId)
  return messages
}

export async function saveMessage(
  sessionId: number,
  role: 'user' | 'bot',
  content: string,
  images: string[] = [],
  rawHtml: string | null = null
): Promise<number> {
  const database = await initDB()
  const id = await database.add('messages', {
    sessionId,
    role,
    content,
    images,
    rawHtml,
    timestamp: Date.now()
  } as Message)
  return id as number
}

export async function createSession(title: string = '新对话'): Promise<number> {
  const database = await initDB()
  const id = Date.now()
  await database.add('sessions', {
    id,
    title,
    timestamp: id
  })
  return id
}

export async function deleteSession(sessionId: number): Promise<void> {
  const database = await initDB()
  await database.delete('sessions', sessionId)

  // Delete all messages for this session
  const tx = database.transaction('messages', 'readwrite')
  const index = tx.store.index('sessionId')
  let cursor = await index.openCursor(sessionId)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}

export async function deleteMessage(messageId: number): Promise<void> {
  const database = await initDB()
  await database.delete('messages', messageId)
}

export async function updateSessionTitle(sessionId: number, title: string): Promise<void> {
  const database = await initDB()
  const session = await database.get('sessions', sessionId)
  if (session) {
    session.title = title
    await database.put('sessions', session)
  }
}
