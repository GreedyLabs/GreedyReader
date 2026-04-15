import { useAuth } from '@clerk/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { searchApi } from '@/lib/api'

export function useBookSearch(query: string) {
  const { getToken } = useAuth()
  return useInfiniteQuery({
    queryKey: ['bookSearch', query],
    queryFn: async ({ pageParam }) => {
      const token = await getToken()
      return searchApi.books(query, token, pageParam)
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextStart = lastPage.start + lastPage.display
      return nextStart <= lastPage.total ? nextStart : undefined
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  })
}
