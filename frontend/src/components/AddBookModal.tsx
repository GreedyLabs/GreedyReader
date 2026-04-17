import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { useBookSearch } from '@/hooks/useBookSearch'
import { useBooks, useCreateBook, useUpdateBook } from '@/hooks/useBooks'
import { memosApi } from '@/lib/api'
import { detectGenre } from '@/lib/genres'
import type { GenreId } from '@/lib/genres'
import GenrePicker from '@/components/GenrePicker'
import type { Book, BookSearchResult } from '@/types'

const STATUS_LABEL: Record<Book['status'], string> = {
  reading:   '읽는 중',
  completed: '완독',
  wish:      '위시',
}
const STATUS_BADGE: Record<Book['status'], string> = {
  reading:   'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  wish:      'bg-gray-100 text-gray-500',
}

interface Props {
  onClose: () => void
}

const STATUS_OPTIONS: { value: Book['status']; label: string; emoji: string }[] = [
  { value: 'wish',      label: '읽고 싶어요', emoji: '🔖' },
  { value: 'reading',   label: '읽는 중',     emoji: '📖' },
  { value: 'completed', label: '완독',         emoji: '✅' },
]

export default function AddBookModal({ onClose }: Props) {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [query, setQuery]       = useState('')
  const [selected, setSelected] = useState<BookSearchResult | null>(null)
  const [status, setStatus]     = useState<Book['status']>('wish')
  const [genre, setGenre]       = useState<GenreId | undefined>(undefined)
  const [duplicate, setDuplicate] = useState<Book | null>(null)

  // 추가 시 바로 입력할 수 있는 선택 필드
  const [memo,      setMemo]      = useState('')
  const [rating,    setRating]    = useState<number | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  const { data: myBooks = [] } = useBooks()
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
  const updateBook = useUpdateBook()

  const results = data?.pages.flatMap((p) => p.data) ?? []

  // 서재에 이미 있는 책을 O(1)로 판별하기 위한 Set
  const libraryIsbnSet = useMemo(
    () => new Set(myBooks.filter((b) => b.isbn).map((b) => b.isbn!)),
    [myBooks],
  )
  const libraryTitleAuthorSet = useMemo(
    () => new Set(myBooks.map((b) => `${b.title.toLowerCase()}|${b.author.toLowerCase()}`)),
    [myBooks],
  )
  const checkInLibrary = (book: BookSearchResult) =>
    (book.isbn && libraryIsbnSet.has(book.isbn)) ||
    libraryTitleAuthorSet.has(`${book.title.toLowerCase()}|${book.author.toLowerCase()}`)

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
    setMemo('')
    setRating(undefined)
    setStartDate('')
    setEndDate('')

    const found = myBooks.find((b) =>
      (book.isbn && b.isbn === book.isbn) ||
      (b.title.toLowerCase() === book.title.toLowerCase() &&
        b.author.toLowerCase() === book.author.toLowerCase()),
    )
    setDuplicate(found ?? null)
  }

  const handleAdd = async () => {
    if (!selected) return
    const today = new Date().toISOString().split('T')[0]

    const book = await createBook.mutateAsync({
      title:       selected.title,
      author:      selected.author,
      coverUrl:    selected.coverUrl || undefined,
      isbn:        selected.isbn || undefined,
      publisher:   selected.publisher || undefined,
      pubdate:     selected.pubdate || undefined,
      description: selected.description || undefined,
      status,
      genre,
      readCount:   1,
      rating:      rating || undefined,
      startDate:   status !== 'wish' ? (startDate || today) : undefined,
      endDate:     status === 'completed' ? (endDate || today) : undefined,
    })

    if (memo.trim()) {
      const token = await getToken()
      await memosApi.create(book.id, { content: memo.trim() }, token)
    }

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
              setDuplicate(null)
            }}
            placeholder="책 제목이나 저자를 검색하세요"
            autoFocus
            className="w-full pl-9 pr-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
          />
        </div>
      </div>

      {/* ── 선택된 책 미리보기 ── */}
      {selected && (
        <div className="mx-4 mb-3 shrink-0">

          {/* 중복 감지 배너 */}
          {duplicate ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex gap-3 items-start">
                {selected.coverUrl ? (
                  <img
                    src={selected.coverUrl}
                    alt={selected.title}
                    className="w-12 h-16 object-cover rounded-lg shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 rounded-lg bg-amber-200 flex items-center justify-center shrink-0 text-xl font-bold text-amber-700">
                    {selected.title[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-amber-600 mb-1">이미 서재에 있어요</p>
                  <p className="font-bold text-gray-900 leading-snug line-clamp-2 text-sm">{selected.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', STATUS_BADGE[duplicate.status])}>
                      {STATUS_LABEL[duplicate.status]}
                    </span>
                    {duplicate.rating && (
                      <span className="text-[11px] text-amber-400">
                        {'★'.repeat(duplicate.rating)}
                        <span className="text-gray-200">{'★'.repeat(5 - duplicate.rating)}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { navigate(`/books/${duplicate.id}`); onClose() }}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                >
                  기존 책으로 이동
                </button>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    updateBook.mutate({
                      id: duplicate.id,
                      data: {
                        readCount: (duplicate.readCount ?? 1) + 1,
                        status: 'reading',
                        startDate: today,
                        endDate: undefined,
                      },
                    }, { onSuccess: onClose })
                  }}
                  disabled={updateBook.isPending}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl gradient-brand text-white hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {updateBook.isPending ? '처리 중...' : `${(duplicate.readCount ?? 1) + 1}독 추가`}
                </button>
              </div>
            </div>
          ) : (
            /* 정상 추가 폼 */
            <div className="p-4 rounded-2xl gradient-brand-subtle border border-violet-200">
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

              {/* 독서 기록 (읽는 중 / 완독일 때만) */}
              {status !== 'wish' && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-400">독서 기록 <span className="text-gray-300">(선택)</span></p>
                  {status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-12 shrink-0">별점</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRating(rating === r ? undefined : r)}
                            className="text-xl leading-none"
                          >
                            <span className={(rating ?? 0) >= r ? 'text-amber-400' : 'text-gray-200'}>★</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-12 shrink-0">시작일</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                  </div>
                  {status === 'completed' && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-12 shrink-0">완독일</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 첫 메모 */}
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1.5">메모 <span className="text-gray-300">(선택)</span></p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="첫 번째 메모를 남겨보세요"
                  rows={2}
                  className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
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
        {results.map((book) => {
          const inLibrary = checkInLibrary(book)
          return (
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
                <div className="flex items-start gap-2">
                  <p className="flex-1 font-semibold text-sm text-gray-900 leading-snug line-clamp-2">
                    {book.title}
                  </p>
                  {inLibrary && (
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 mt-0.5">
                      서재에 있음
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{book.author}</p>
                <p className="text-xs text-gray-400 truncate">
                  {[book.publisher, book.pubdate?.slice(0, 4)].filter(Boolean).join(' · ')}
                </p>
              </div>

              {selected?.isbn === book.isbn && (
                <span className="shrink-0 self-center text-brand-600 text-lg">✓</span>
              )}
            </button>
          )
        })}

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
