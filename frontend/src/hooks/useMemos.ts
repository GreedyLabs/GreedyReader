import { useAuth } from '@clerk/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { memosApi } from '@/lib/api'
import type { Memo } from '@/types'

function useToken() {
  const { getToken } = useAuth()
  return getToken
}

export function useBookMemos(bookId: string) {
  const getToken = useToken()
  return useQuery({
    queryKey: ['memos', bookId],
    queryFn: async () => {
      const token = await getToken()
      const res = await memosApi.getAll(bookId, token)
      return res.data
    },
  })
}

export function useCreateMemo(bookId: string) {
  const getToken = useToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Memo, 'id' | 'bookId' | 'createdAt'>) => {
      const token = await getToken()
      const res = await memosApi.create(bookId, data, token)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos', bookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useDeleteMemo(bookId: string) {
  const getToken = useToken()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (memoId: string) => {
      const token = await getToken()
      await memosApi.delete(bookId, memoId, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos', bookId] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}
