import { NavLink, Outlet } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { cn } from '@/lib/utils'
import InstallPrompt from '@/components/InstallPrompt'

const NAV_ITEMS = [
  { to: '/', label: '서재', icon: '📚', end: true },
  { to: '/stats', label: '통계', icon: '📊', end: false },
  { to: '/ai', label: 'AI코치', icon: '🤖', end: false },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">

      {/* ── 데스크탑 사이드바 (md 이상에서만 표시) ── */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-gray-200 bg-white flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-bold text-brand-700">GreedyReader</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI 독서노트</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100',
                )
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
          <p className="text-xs font-medium text-brand-700">무료 플랜</p>
          <p className="text-xs text-gray-500 mt-0.5">AI 기능은 Pro에서</p>
          <button className="mt-2 w-full text-xs bg-brand-600 text-white py-1.5 rounded-md hover:bg-brand-700 transition-colors">
            업그레이드
          </button>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
          <UserButton />
          <span className="text-xs text-gray-500">내 계정</span>
        </div>
      </aside>

      {/* ── 메인 영역 ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* 모바일 상단 헤더 (md 미만에서만 표시) */}
        <header className="md:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <h1 className="text-base font-bold text-brand-700">GreedyReader</h1>
          <UserButton />
        </header>

        {/* 스크롤 가능한 콘텐츠 — 모바일은 하단 탭바 높이만큼 여백 */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <InstallPrompt />

      {/* ── 모바일 하단 탭바 (md 미만에서만 표시) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100">
        <div className="flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors',
                  isActive ? 'text-brand-600' : 'text-gray-400',
                )
              }
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  )
}
