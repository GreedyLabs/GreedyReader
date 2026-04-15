import { useAuth } from '@clerk/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { booksApi } from '@/lib/api'
import type { Book } from '@/types'

// getToken()은 캐시된 토큰을 반환하거나 만료 시 자동 갱신함
function useToken() {
  const { getToken } = useAuth()
  return getToken
}

export function useBooks() {
  const getToken = useToken()
  return useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const token = await getToken()
      const res = await booksApi.getAll(token)
      return res.data
    },
  })
}

export function useCreateBook() {
  const getToken = useToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Book, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      const token = await getToken()
      const res = await booksApi.create(data, token)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useUpdateBook() {
  const getToken = useToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Book> }) => {
      const token = await getToken()
      const res = await booksApi.update(id, data, token)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useDeleteBook() {
  const getToken = useToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken()
      await booksApi.delete(id, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}
