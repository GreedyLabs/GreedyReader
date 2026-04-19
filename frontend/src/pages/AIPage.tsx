import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types'
import { cn } from '@/lib/utils'
import { IconAI, IconMic, IconSend } from '@/components/icons'

const IS_PRO = false // 추후 구독 상태 연동

const SUGGESTIONS = ['이번 주 읽은 부분 요약해줘', '비슷한 분위기의 책 추천', '내 독서 패턴 분석']

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '안녕하세요! 저는 AI 독서 코치입니다. 읽고 있는 책에 대해 이야기해 볼까요? 궁금한 점, 인상 깊었던 부분, 저자의 의도 등 무엇이든 질문해 주세요.',
    },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!IS_PRO) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-10">
        {/* 헤더 */}
        <div className="mb-5">
          <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">AI Coach</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-0.5">AI 독서 코치</h2>
          <p className="text-xs text-gray-400 mt-1">나의 독서 취향을 기억하는 친구</p>
        </div>

        {/* AI 프로필 카드 */}
        <div className="gradient-brand-subtle rounded-2xl p-4 border border-violet-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-white shrink-0">
              <IconAI size={24} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-gray-900">리더 코치</div>
              <div className="text-[11px] text-gray-500 mt-0.5">독서 메모와 패턴을 분석해드려요</div>
            </div>
            <span className="text-[10px] bg-violet-700 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>
          </div>
        </div>

        {/* 기능 안내 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
          <div className="space-y-3">
            {[
              { icon: <IconAI size={16} />, text: '독서 패턴 분석 및 월간 리포트' },
              { icon: <IconAI size={16} />, text: '나의 독서 이력 기반 맞춤 도서 추천' },
              { icon: <IconMic size={16} />, text: '보이스 메모 자동 전사 + AI 요약' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="text-violet-500 shrink-0">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* 업그레이드 CTA */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Claude AI와 함께 책을 더 깊이 이해하세요
          </p>
          <button className="px-6 py-3 gradient-brand text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-sm">
            Pro로 업그레이드 (준비중)
          </button>
        </div>
      </div>
    )
  }

  const handleSend = () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { role: 'user', content: input }])
    setInput('')
    // TODO: API 연동
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white shrink-0">
            <IconAI size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">AI 독서 코치</h2>
            <p className="text-[11px] text-gray-400">Powered by Claude</p>
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-auto px-4 py-5 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : '')}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-white shrink-0 mt-0.5">
                <IconAI size={14} />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'gradient-brand text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* 제안 프롬프트 (마지막 메시지가 assistant일 때) */}
        {messages[messages.length - 1]?.role === 'assistant' && (
          <div className="pl-9">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">추천 질문</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:border-violet-400 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력 영역 */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="메시지를 입력하세요"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <button className="text-gray-400 shrink-0 hover:text-gray-600 transition-colors">
            <IconMic size={18} />
          </button>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
          >
            <IconSend size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
