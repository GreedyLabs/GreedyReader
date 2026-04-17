import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { getBookColor } from '@/lib/bookColor'
import GenrePicker from '@/components/GenrePicker'
import type { GenreId } from '@/lib/genres'
import { useBooks, useUpdateBook, useDeleteBook } from '@/hooks/useBooks'
import { useBookMemos, useCreateMemo, useDeleteMemo } from '@/hooks/useMemos'
import type { Book } from '@/types'

// ── 뱃지 스타일 (BooksPage와 동일) ──────────────────────
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
const STATUS_OPTIONS: { value: Book['status']; label: string }[] = [
  { value: 'wish',      label: '위시' },
  { value: 'reading',   label: '읽는 중' },
  { value: 'completed', label: '완독' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}


// ── 컴포넌트 ────────────────────────────────────────────
export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: books = [], isLoading } = useBooks()
  const book = books.find((b) => b.id === id)

  const updateBook  = useUpdateBook()
  const deleteBook  = useDeleteBook()
  const { data: memos = [] } = useBookMemos(id!)
  const createMemo  = useCreateMemo(id!)
  const deleteMemo  = useDeleteMemo(id!)

  const [showForm,   setShowForm]   = useState(false)
  const [content,    setContent]    = useState('')
  const [highlight,  setHighlight]  = useState('')
  const [page,       setPage]       = useState('')
  const [expanded,   setExpanded]   = useState(false)

  // ── 로딩 / 미발견 ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
        불러오는 중...
      </div>
    )
  }
  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
        <p className="text-sm">책을 찾을 수 없습니다</p>
        <button onClick={() => navigate('/')} className="text-xs text-brand-600 underline">
          서재로 돌아가기
        </button>
      </div>
    )
  }

  const cover = getBookColor(book.title)

  // ── 이벤트 핸들러 ────────────────────────────────────
  const handleRating = (r: number) => {
    updateBook.mutate({ id: book.id, data: { rating: book.rating === r ? undefined : r } })
  }

  const handleStatus = (s: Book['status']) => {
    const today = new Date().toISOString().split('T')[0]
    const extra: Partial<Book> = {}
    if (s === 'reading'   && !book.startDate) extra.startDate = today
    if (s === 'completed' && !book.startDate) extra.startDate = today
    if (s === 'completed' && !book.endDate)   extra.endDate   = today
    updateBook.mutate({ id: book.id, data: { status: s, ...extra } })
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    updateBook.mutate({ id: book.id, data: { [field]: value || undefined } })
  }

  const handleDelete = () => {
    if (!confirm(`"${book.title}"을(를) 서재에서 삭제할까요?`)) return
    deleteBook.mutate(book.id, { onSuccess: () => navigate('/') })
  }

  const handleSubmitMemo = async () => {
    if (!content.trim()) return
    const pageNum = parseInt(page)
    await createMemo.mutateAsync({
      content:   content.trim(),
      highlight: highlight.trim() || undefined,
      page:      isNaN(pageNum) ? undefined : pageNum,
    })
    setContent('')
    setHighlight('')
    setPage('')
    setShowForm(false)
  }

  // ── 렌더 ─────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-28">

      {/* ── 헤더 ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 shrink-0"
        >
          ←
        </button>
        <h1 className="flex-1 text-sm font-bold text-gray-900 truncate">{book.title}</h1>
        <button
          onClick={handleDelete}
          className="text-xs text-red-400 hover:text-red-600 px-2 py-1 shrink-0"
        >
          삭제
        </button>
      </div>

      <div className="px-4 pt-5 space-y-6">

        {/* ── 책 정보 ── */}
        <div className="flex gap-4">
          {/* 표지 */}
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-24 h-36 rounded-xl object-cover shadow-md shrink-0"
            />
          ) : (
            <div
              className="w-24 h-36 rounded-xl flex items-center justify-center shrink-0 shadow-md text-4xl font-black select-none"
              style={{ backgroundColor: cover.bg, color: cover.text }}
            >
              {book.title[0]}
            </div>
          )}

          {/* 메타 */}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg text-gray-900 leading-snug">{book.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
            {(book.publisher || book.pubdate) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {[
                  book.publisher,
                  book.pubdate && book.pubdate.slice(0, 6),
                ].filter(Boolean).join(' | ')}
              </p>
            )}
            <span className={cn(
              'mt-2 inline-block text-[11px] font-bold px-2.5 py-1 rounded-full',
              STATUS_BADGE[book.status],
            )}>
              {STATUS_LABEL[book.status]}
            </span>
          </div>
        </div>

        {/* ── 설명 ── */}
        {book.description && (
          <div>
            <p className={cn('text-sm text-gray-600 leading-relaxed', !expanded && 'line-clamp-4')}>
              {book.description}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs text-brand-600 font-medium"
            >
              {expanded ? '접기' : '더보기'}
            </button>
          </div>
        )}

        {/* ── 별점 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">별점</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                onClick={() => handleRating(r)}
                className="text-2xl leading-none"
              >
                <span className={(book.rating ?? 0) >= r ? 'text-amber-400' : 'text-gray-200'}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 상태 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">독서 상태</p>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatus(opt.value)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
                  book.status === opt.value
                    ? STATUS_BADGE[opt.value]
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 장르 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">장르</p>
          <GenrePicker
            value={book.genre as GenreId | undefined}
            onChange={(id) => updateBook.mutate({ id: book.id, data: { genre: id } })}
          />
        </div>

        {/* ── 독서 기록 ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">독서 기록</p>
          <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100">
            {/* 등록일 */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-400">등록일</span>
              <span className="text-xs text-gray-700">{formatFullDate(book.createdAt)}</span>
            </div>

            {/* 읽기 시작 */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-400">읽기 시작</span>
              <input
                type="date"
                value={book.startDate ?? ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="text-xs text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer"
              />
            </div>

            {/* 다 읽은 날 */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-400">다 읽은 날</span>
              <input
                type="date"
                value={book.endDate ?? ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="text-xs text-gray-700 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ── 메모 ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              메모 {memos.length}개
            </p>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {showForm ? '취소' : '+ 메모 추가'}
            </button>
          </div>

          {/* 메모 입력 폼 */}
          {showForm && (
            <div className="mb-4 p-4 bg-gray-50 rounded-2xl space-y-2.5">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="메모를 입력하세요"
                rows={3}
                className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <input
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                placeholder="인용구 (선택)"
                className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <input
                type="number"
                value={page}
                onChange={(e) => setPage(e.target.value)}
                placeholder="페이지 (선택)"
                className="w-full text-sm bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                onClick={handleSubmitMemo}
                disabled={!content.trim() || createMemo.isPending}
                className="w-full py-2.5 gradient-brand text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {createMemo.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          )}

          {/* 메모 목록 */}
          {memos.length === 0 && !showForm && (
            <div className="flex flex-col items-center py-10 text-gray-300">
              <span className="text-3xl mb-2">📝</span>
              <p className="text-sm">아직 메모가 없어요</p>
            </div>
          )}
          <div className="space-y-3">
            {memos.map((memo) => (
              <div key={memo.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                {memo.highlight && (
                  <blockquote className="border-l-2 border-brand-400 pl-3 mb-2 text-sm text-gray-500 italic leading-snug">
                    {memo.highlight}
                  </blockquote>
                )}
                <p className="text-sm text-gray-800 leading-relaxed">{memo.content}</p>
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex gap-2 text-[11px] text-gray-400">
                    {memo.page && <span>p.{memo.page}</span>}
                    <span>{formatDate(memo.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => deleteMemo.mutate(memo.id)}
                    className="text-[11px] text-gray-300 hover:text-red-400 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
