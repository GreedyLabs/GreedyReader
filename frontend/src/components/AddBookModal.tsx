import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { useBookSearch } from '@/hooks/useBookSearch'
import { useCreateBook } from '@/hooks/useBooks'
import { detectGenre } from '@/lib/genres'
import type { GenreId } from '@/lib/genres'
import GenrePicker from '@/components/GenrePicker'
import type { Book, BookSearchResult } from '@/types'

interface Props {
  onClose: () => void
}

const STATUS_OPTIONS: { value: Book['status']; label: string; emoji: string }[] = [
  { value: 'wish',      label: '읽고 싶어요', emoji: '🔖' },
  { value: 'reading',   label: '읽는 중',     emoji: '📖' },
  { value: 'completed', label: '완독',         emoji: '✅' },
]

export default function AddBookModal({ onClose }: Props) {
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<BookSearchResult | null>(null)
  const [status, setStatus]     = useState<Book['status']>('wish')
  const [genre, setGenre]       = useState<GenreId | undefined>(undefined)

  const debouncedQuery = useDebounce(query, 400)
  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBookSearch(debouncedQuery)
  const createBook = useCreateBook()

  const results = data?.pages.flatMap((p) => p.data) ?? []

  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const handleSelect = (book: BookSearchResult) => {
    setSelected(book)
    setGenre(detectGenre(book.description ?? '', book.title))
  }

  const handleAdd = async () => {
    if (!selected) return
    await createBook.mutateAsync({
      title:       selected.title,
      author:      selected.author,
      coverUrl:    selected.coverUrl || undefined,
      isbn:        selected.isbn || undefined,
      publisher:   selected.publisher || undefined,
      pubdate:     selected.pubdate || undefined,
      description: selected.description || undefined,
      status,
      genre,
    })
    onClose()
  }

  const isSearching = debouncedQuery.length >= 2 && (isLoading || (isFetching && results.length === 0))

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">

      {/* ── 헤더 ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="닫기"
        >
          ✕
        </button>
        <h2 className="text-base font-bold text-gray-900">책 추가</h2>
      </div>

      {/* ── 검색 입력 ── */}
      <div className="px-4 py-3 shrink-0">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
            }}
            placeholder="책 제목이나 저자를 검색하세요"
            autoFocus
            className="w-full pl-9 pr-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
          />
        </div>
      </div>

      {/* ── 선택된 책 미리보기 + 상태 선택 ── */}
      {selected && (
        <div className="mx-4 mb-3 p-4 rounded-2xl gradient-brand-subtle border border-violet-200 shrink-0">
          <div className="flex gap-3 items-start mb-3">
            {selected.coverUrl ? (
              <img
                src={selected.coverUrl}
                alt={selected.title}
                className="w-12 h-16 object-cover rounded-lg shadow-sm shrink-0"
              />
            ) : (
              <div className="w-12 h-16 rounded-lg gradient-brand flex items-center justify-center shrink-0 text-xl font-bold text-white">
                {selected.title[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 leading-snug line-clamp-2">{selected.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{selected.author}</p>
              <p className="text-xs text-gray-400">{selected.publisher}</p>
            </div>
          </div>

          {/* 상태 선택 */}
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs font-semibold transition-all',
                  status === opt.value
                    ? 'gradient-brand text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200',
                )}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* 장르 선택 */}
          <div className="mt-3">
            <p className="text-xs text-gray-400 mb-2">장르 <span className="text-gray-300">(선택)</span></p>
            <GenrePicker value={genre} onChange={setGenre} />
          </div>

          <button
            onClick={handleAdd}
            disabled={createBook.isPending}
            className="mt-3 w-full py-3 gradient-brand text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {createBook.isPending ? '추가 중...' : '내 서재에 추가하기'}
          </button>
        </div>
      )}

      {/* ── 검색 결과 ── */}
      <div className="flex-1 overflow-auto">
        {/* 안내 문구 */}
        {debouncedQuery.length < 2 && !selected && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-300">
            <span className="text-4xl">📚</span>
            <p className="text-sm">두 글자 이상 입력해서 검색하세요</p>
          </div>
        )}

        {/* 로딩 */}
        {isSearching && (
          <div className="flex justify-center py-8 text-sm text-gray-400">
            검색 중...
          </div>
        )}

        {/* 결과 없음 */}
        {!isSearching && debouncedQuery.length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300">
            <span className="text-4xl mb-2">🔍</span>
            <p className="text-sm text-gray-400">검색 결과가 없어요</p>
          </div>
        )}

        {/* 결과 목록 */}
        {results.map((book) => (
          <button
            key={book.isbn}
            onClick={() => handleSelect(book)}
            className={cn(
              'w-full flex gap-3 px-4 py-3.5 border-b border-gray-100 text-left transition-colors',
              selected?.isbn === book.isbn ? 'bg-brand-50' : 'hover:bg-gray-50 active:bg-gray-100',
            )}
          >
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-11 h-16 object-cover rounded-lg shadow-sm shrink-0"
              />
            ) : (
              <div className="w-11 h-16 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 text-lg font-bold text-gray-400">
                {book.title[0]}
              </div>
            )}

            <div className="flex-1 min-w-0 py-0.5">
              <p className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2">
                {book.title}
              </p>
              <p className="text-xs text-gray-500 mt-1 truncate">{book.author}</p>
              <p className="text-xs text-gray-400 truncate">
                {[book.publisher, book.pubdate?.slice(0, 4)].filter(Boolean).join(' · ')}
              </p>
            </div>

            {selected?.isbn === book.isbn && (
              <span className="shrink-0 self-center text-brand-600 text-lg">✓</span>
            )}
          </button>
        ))}

        {/* 무한 스크롤 센티넬 */}
        <div ref={sentinelRef} className="py-4 flex justify-center">
          {isFetchingNextPage && (
            <p className="text-xs text-gray-400">더 불러오는 중...</p>
          )}
        </div>
      </div>
    </div>
  )
}
