import { useRegisterSW } from 'virtual:pwa-register/react'

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed top-4 inset-x-4 md:left-auto md:right-4 md:w-80 z-50 bg-white border border-brand-200 rounded-xl shadow-lg p-4 flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl">
        🔄
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">새 버전이 있어요</p>
        <p className="text-xs text-gray-500 mt-0.5">
          업데이트 후 최신 기능을 사용할 수 있어요.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => void updateServiceWorker(true)}
            className="flex-1 text-xs gradient-brand text-white py-1.5 rounded-md hover:opacity-90 transition-all"
          >
            지금 업데이트
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="text-xs text-gray-500 px-3 py-1.5 hover:text-gray-700 transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  )
}
