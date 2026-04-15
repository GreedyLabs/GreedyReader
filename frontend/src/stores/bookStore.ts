import { create } from 'zustand'
import type { Book } from '@/types'

interface BookStore {
  selectedBookId: string | null
  selectBook: (id: string | null) => void
  filterStatus: 'all' | Book['status']
  setFilterStatus: (status: 'all' | Book['status']) => void
}

export const useBookStore = create<BookStore>((set) => ({
  selectedBookId: null,
  selectBook: (id) => set({ selectedBookId: id }),
  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status }),
}))
