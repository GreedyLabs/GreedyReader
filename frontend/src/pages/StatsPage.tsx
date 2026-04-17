import { useMemo } from 'react'
import { useBooks } from '@/hooks/useBooks'
import { GENRES, GENRE_COLOR, GENRE_LABEL } from '@/lib/genres'
import type { GenreId } from '@/lib/genres'

const MONTH_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

export default function StatsPage() {
  const { data: books = [], isLoading } = useBooks()

  const stats = useMemo(() => {
    const thisYear = new Date().getFullYear()

    const completed = books.filter((b) => b.status === 'completed')
    const completedThisYear = completed.filter(
      (b) => b.endDate && new Date(b.endDate).getFullYear() === thisYear,
    )

    const ratings = completed.filter((b) => b.rating).map((b) => b.rating!)
    const avgRating = ratings.length
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : 0

    // 월별 완독 수 (올해 1~12월)
    const monthlyCount = Array.from({ length: 12 }, (_, i) =>
      completedThisYear.filter((b) => {
        if (!b.endDate) return false
        return new Date(b.endDate).getMonth() === i
      }).length,
    )

    // 장르 분포 (장르 있는 책만)
    const genreMap = new Map<GenreId, number>()
    books.forEach((b) => {
      if (!b.genre) return
      const id = b.genre as GenreId
      genreMap.set(id, (genreMap.get(id) ?? 0) + 1)
    })
    const genreTotal = Array.from(genreMap.values()).reduce((s, n) => s + n, 0)
    const genreData = Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({
        id,
        label: GENRE_LABEL[id] ?? id,
        count,
        pct: genreTotal ? Math.round((count / genreTotal) * 100) : 0,
      }))

    return { completed, completedThisYear, avgRating, monthlyCount, genreData, genreTotal }
  }, [books])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
        불러오는 중...
      </div>
    )
  }

  const maxMonthly = Math.max(...stats.monthlyCount, 1)
  const BAR_MAX_HEIGHT = 72 // px

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-10">

      {/* ── 헤더 ── */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Statistics</p>
        <h2 className="text-2xl font-bold text-gray-900 mt-0.5">독서 통계</h2>
        <p className="text-xs text-gray-400 mt-1">{new Date().getFullYear()}년</p>
      </div>

      {/* ── 요약 카드 ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: '전체',     value: `${books.length}권`,                          icon: '📚' },
          { label: '올해 완독', value: `${stats.completedThisYear.length}권`,         icon: '✅' },
          { label: '평균 별점', value: stats.avgRating ? `${stats.avgRating.toFixed(1)}` : '—', icon: '⭐' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── 월별 완독 바 차트 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-4">월별 완독</h3>
        {stats.completedThisYear.length === 0 ? (
          <p className="text-center text-xs text-gray-300 py-8">올해 완독한 책이 없어요</p>
        ) : (
          <div className="flex items-end gap-1" style={{ height: `${BAR_MAX_HEIGHT + 28}px` }}>
            {stats.monthlyCount.map((count, i) => {
              const barH = count > 0 ? Math.max(4, Math.round((count / maxMonthly) * BAR_MAX_HEIGHT)) : 2
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                  {count > 0 && (
                    <span className="text-[10px] font-semibold text-violet-700">{count}</span>
                  )}
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${barH}px`,
                      background: count > 0
                        ? 'linear-gradient(to top, #5b21b6, #4338ca)'
                        : '#f3f4f6',
                    }}
                  />
                  <span className="text-[9px] text-gray-300 leading-none">{MONTH_LABELS[i]}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 장르 분포 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-1">장르 분포</h3>
        <p className="text-xs text-gray-400 mb-4">
          {stats.genreTotal}권에 장르 설정됨
          {books.length - stats.genreTotal > 0 && (
            <span className="text-gray-300"> · 미설정 {books.length - stats.genreTotal}권</span>
          )}
        </p>

        {stats.genreTotal === 0 ? (
          <div className="text-center py-8 space-y-1">
            <p className="text-xs text-gray-400">아직 장르가 설정된 책이 없어요</p>
            <p className="text-xs text-gray-300">책 추가 또는 책 상세에서 장르를 선택해보세요</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {stats.genreData.map(({ id, label, count, pct }) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-16 shrink-0 truncate">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: GENRE_COLOR[id] ?? '#6b7280',
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right shrink-0">
                    {count}권 <span className="text-gray-300">({pct}%)</span>
                  </span>
                </div>
              ))}
            </div>

            {/* 범례 */}
            <div className="mt-5 flex flex-wrap gap-x-3 gap-y-2">
              {GENRES.filter((g) => stats.genreData.some((d) => d.id === g.id)).map((g) => (
                <div key={g.id} className="flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="text-[10px] text-gray-400">{g.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
