export interface Book {
  id: string
  title: string
  author: string
  coverUrl?: string
  startDate?: string
  endDate?: string
  rating?: number
  status: 'reading' | 'completed' | 'wish'
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

export interface ApiError {
  message: string
  code?: string
}
