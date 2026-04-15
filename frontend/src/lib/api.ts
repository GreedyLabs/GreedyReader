import type { Book, Memo, BookSearchPage, ApiResponse } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function request<T>(
  path: string,
  token: string | null,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message ?? `HTTP ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

type Token = string | null

export const booksApi = {
  getAll: (token: Token) =>
    request<ApiResponse<Book[]>>('/api/v1/books', token),
  getOne: (id: string, token: Token) =>
    request<ApiResponse<Book>>(`/api/v1/books/${id}`, token),
  create: (data: Omit<Book, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, token: Token) =>
    request<ApiResponse<Book>>('/api/v1/books', token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Book>, token: Token) =>
    request<ApiResponse<Book>>(`/api/v1/books/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string, token: Token) =>
    request<undefined>(`/api/v1/books/${id}`, token, { method: 'DELETE' }),
}

export const searchApi = {
  books: (query: string, token: Token, start = 1) =>
    request<BookSearchPage>(
      `/api/v1/search/books?query=${encodeURIComponent(query)}&start=${start}`,
      token,
    ),
}

export const memosApi = {
  getAll: (bookId: string, token: Token) =>
    request<ApiResponse<Memo[]>>(`/api/v1/books/${bookId}/memos`, token),
  create: (bookId: string, data: Omit<Memo, 'id' | 'bookId' | 'createdAt'>, token: Token) =>
    request<ApiResponse<Memo>>(`/api/v1/books/${bookId}/memos`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (bookId: string, memoId: string, token: Token) =>
    request<undefined>(`/api/v1/books/${bookId}/memos/${memoId}`, token, {
      method: 'DELETE',
    }),
}
