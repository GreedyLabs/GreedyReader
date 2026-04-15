import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getBookColor } from '@/lib/bookColor'
import { useBooks } from '@/hooks/useBooks'
import AddBookModal from '@/components/AddBookModal'
import type { Book } from '@/types'

// ── 필터 ──────────────────────────────────────────────
const FILTER_TABS = [
  { value: 'all',       label: '전체' },
  { value: 'reading',   label: '읽는 중' },
  { value: 'completed', label: '완독' },
  { value: 'wish',      label: '위시리스트' },
] as const

type FilterValue = (typeof FILTER_TABS)[number]['value']

// ── 정렬 ──────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'recent',      label: '최근 활동순' },
  { value: 'memo_recent', label: '최근 메모순' },
  { value: 'read_recent', label: '최근 읽은순' },
  { value: 'name_asc',    label: '이름 오름차순' },
  { value: 'name_desc',   label: '이름 내림차순' },
] as const

type SortValue = (typeof SORT_OPTIONS)[number]['value']

function toMs(val: string | null | undefined) {
  return val ? new Date(val).getTime() : 0
}

function sortBooks(books: Book[], sort: SortValue): Book[] {
  return [...books].sort((a, b) => {
    switch (sort) {
      case 'recent':
        // 메모 시각, 완독 날짜, 업데이트 시각 중 가장 최근값 비교
        return (
          Math.max(toMs(b.lastMemoAt), toMs(b.endDate), toMs(b.updatedAt)) -
          Math.max(toMs(a.lastMemoAt), toMs(a.endDate), toMs(a.updatedAt))
        )
      case 'memo_recent':
        return toMs(b.lastMemoAt) - toMs(a.lastMemoAt)
      case 'read_recent':
        return toMs(b.endDate) - toMs(a.endDate)
      case 'name_asc':
        return a.title.localeCompare(b.title, 'ko')
      case 'name_desc':
        return b.title.localeCompare(a.title, 'ko')
    }
  })
}

// ── 뱃지 스타일 ───────────────────────────────────────
const STATUS_LABEL: Record<Book['status'], string> = {
  reading:   '읽는 중',
  completed: '완독',
  wish:      '위시',
}
const STATUS_BADGE: Record<Book['status'], string> = {
  reading:   'bg-blue-500 text-white',
  completed: 'bg-emerald-500 text-white',
  wish:      'bg-gray-400 text-white',
}

// ── 컴포넌트 ──────────────────────────────────────────
export default function BooksPage() {
  const navigate = useNavigate()
  const [filter, setFilter]       = useState<FilterValue>('all')
  const [sort, setSort]           = useState<SortValue>('recent')
  const [showAddModal, setShowAddModal] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)

  const { data: books = [], isLoading, isError } = useBooks()

  const readingBooks = books.filter((b) => b.status === 'reading')

  // 터치 스와이프
  const touchStartX = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 40) return
    if (diff > 0) setSlideIndex((i) => Math.min(i + 1, readingBooks.length - 1))
    else          setSlideIndex((i) => Math.max(i - 1, 0))
  }

  const displayBooks = useMemo(() => {
    const filtered = filter === 'all' ? books : books.filter((b) => b.status === filter)
    return sortBooks(filtered, sort)
  }, [books, filter, sort])

  return (
    <>
    {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} />}
    <div className="max-w-2xl mx-auto px-4 pt-5">

      {/* ── 헤더 ── */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">My Library</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-0.5">내 서재</h2>
          <p className="text-xs text-gray-400 mt-1">
            {books.length}권 보유 · 완독 {books.filter(b => b.status === 'completed').length}권
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 active:scale-95 transition-all shadow-sm"
        >
          <span>+</span> 책 추가
        </button>
      </div>

      {/* ── 지금 읽는 책 히어로 (슬라이더) ── */}
      {readingBooks.length > 0 && (
        <div className="mb-6">
          {/* 슬라이드 뷰포트 */}
          <div
            className="overflow-hidden rounded-2xl shadow-sm"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              {readingBooks.map((book) => {
                const cover = getBookColor(book.title)
                return (
                  <div
                    key={book.id}
                    className="w-full shrink-0 p-5 flex items-center gap-4 cursor-pointer"
                    style={{ backgroundColor: cover.bg }}
                    onClick={() => navigate(`/books/${book.id}`)}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-14 h-20 rounded-xl object-cover shrink-0 shadow-md"
                      />
                    ) : (
                      <div
                        className="w-14 h-20 rounded-xl flex items-center justify-center shrink-0 shadow-md text-3xl font-black select-none"
                        style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: cover.text }}
                      >
                        {book.title[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium mb-1" style={{ color: cover.text, opacity: 0.6 }}>
                        지금 읽고 있어요
                      </p>
                      <p className="font-bold text-lg leading-tight truncate" style={{ color: cover.text }}>
                        {book.title}
                      </p>
                      <p className="text-sm truncate mt-0.5" style={{ color: cover.text, opacity: 0.6 }}>
                        {book.author}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 점 인디케이터 */}
          {readingBooks.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2.5">
              {readingBooks.map((book, i) => (
                <button
                  key={book.id}
                  onClick={() => setSlideIndex(i)}
                  className={cn(
                    'rounded-full transition-all duration-200',
                    i === slideIndex ? 'w-4 h-1.5 bg-gray-500' : 'w-1.5 h-1.5 bg-gray-300',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 필터 + 정렬 ── */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* 필터 탭 — 가로 스크롤 */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all',
                filter === tab.value
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 정렬 셀렉트 */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortValue)}
          className="shrink-0 text-xs text-gray-500 bg-gray-100 border-0 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ── 상태 ── */}
      {isLoading && (
        <div className="flex flex-col items-center py-24 text-gray-300">
          <span className="text-5xl mb-3">📚</span>
          <p className="text-sm">불러오는 중...</p>
        </div>
      )}
      {isError && (
        <p className="text-center py-16 text-sm text-red-400">
          데이터를 불러오지 못했습니다.
        </p>
      )}
      {!isLoading && !isError && displayBooks.length === 0 && (
        <div className="flex flex-col items-center py-24 text-gray-300">
          <span className="text-5xl mb-3">📖</span>
          <p className="text-sm text-gray-400">
            {filter === 'all' ? '첫 번째 책을 추가해보세요' : '해당하는 책이 없어요'}
          </p>
        </div>
      )}

      {/* ── 책 그리드 ── */}
      {!isLoading && !isError && displayBooks.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 pb-6">
          {displayBooks.map((book) => {
            const cover = getBookColor(book.title)
            return (
              <div
                key={book.id}
                className="group rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
                onClick={() => navigate(`/books/${book.id}`)}
              >
                {/* 표지 — 2:3 비율 (실제 책 비율) */}
                <div
                  className="relative flex items-end justify-start"
                  style={{ aspectRatio: '2/3', backgroundColor: cover.bg }}
                >
                  {book.coverUrl ? (
                    /* 실제 표지 이미지 */
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    /* 표지 없을 때: 배경 이니셜 + 제목 오버레이 */
                    <>
                      <span
                        className="absolute inset-0 flex items-center justify-center text-6xl font-black select-none pointer-events-none"
                        style={{ color: 'rgba(255,255,255,0.08)' }}
                      >
                        {book.title[0]}
                      </span>
                      <div
                        className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-6"
                        style={{
                          background: `linear-gradient(to top, ${cover.bg}ff 0%, ${cover.bg}00 100%)`,
                        }}
                      >
                        <p
                          className="text-[11px] font-bold leading-tight line-clamp-2"
                          style={{ color: cover.text }}
                        >
                          {book.title}
                        </p>
                      </div>
                    </>
                  )}

                  {/* 상태 뱃지 */}
                  <span
                    className={cn(
                      'absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                      STATUS_BADGE[book.status],
                    )}
                  >
                    {STATUS_LABEL[book.status]}
                  </span>
                </div>

                {/* 하단 정보 */}
                <div className="px-2.5 py-2">
                  <p className="text-xs font-semibold text-gray-800 truncate">{book.title}</p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{book.author}</p>
                  {book.rating ? (
                    <p className="text-[10px] text-amber-400 mt-1">
                      {'★'.repeat(book.rating)}
                      <span className="text-gray-200">{'★'.repeat(5 - book.rating)}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-200 mt-1">★★★★★</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  </>
  )
}
