import { useState } from 'react'
import type { ChatMessage } from '@/types'
import { cn } from '@/lib/utils'

const IS_PRO = false // 추후 구독 상태 연동

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '안녕하세요! 저는 AI 독서 코치입니다. 읽고 있는 책에 대해 이야기해 볼까요? 궁금한 점, 인상 깊었던 부분, 저자의 의도 등 무엇이든 질문해 주세요.',
    },
  ])
  const [input, setInput] = useState('')

  if (!IS_PRO) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full">
        <div className="text-6xl mb-4">🤖</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">AI 독서코치</h2>
        <p className="text-gray-500 text-center max-w-sm mb-6">
          Claude AI와 함께 책을 더 깊이 이해하세요.
          <br />
          메모 정리, 책 토론, 도서 추천 기능을 이용할 수 있습니다.
        </p>
        <button className="px-6 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors">
          Pro로 업그레이드
        </button>
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
      <div className="px-8 py-5 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-bold text-gray-900">AI 독서코치</h2>
        <p className="text-xs text-gray-400">Powered by Claude</p>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-auto px-8 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      {/* 입력 영역 */}
      <div className="px-8 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="책에 대해 무엇이든 물어보세요..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  )
}
