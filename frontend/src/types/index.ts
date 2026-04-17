export interface Book {
  id: string
  userId: string
  title: string
  author: string
  coverUrl?: string
  isbn?: string
  publisher?: string
  pubdate?: string   // YYYYMMDD
  description?: string
  genre?: string
  startDate?: string
  endDate?: string
  rating?: number // 1-5
  readCount: number // 몇 번째 읽기인지 (기본 1)
  status: 'reading' | 'completed' | 'wish'
  lastMemoAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface Memo {
  id: string
  bookId: string
  content: string
  highlight?: string
  page?: number
  createdAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface User {
  id: string
  email: string
  subscriptionTier: 'free' | 'pro'
  subscriptionExpiresAt?: string
}

export interface BookSearchResult {
  title: string
  author: string
  publisher: string
  coverUrl: string
  isbn: string
  description: string
  pubdate: string // YYYYMMDD
}

export type ApiResponse<T> = {
  data: T
  message?: string
}

export interface BookSearchPage {
  data:    BookSearchResult[]
  total:   number
  start:   number
  display: number
}
