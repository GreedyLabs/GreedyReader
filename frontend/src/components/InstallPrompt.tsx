import { usePWAInstall } from '@/hooks/usePWAInstall'

export default function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = usePWAInstall()

  if (!canInstall) return null

  return (
    <div className="fixed bottom-20 md:bottom-4 inset-x-4 md:left-auto md:right-4 md:w-80 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl">
        📖
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">홈 화면에 추가</p>
        <p className="text-xs text-gray-500 mt-0.5">
          앱으로 설치하면 바코드 스캔·음성 메모가 더 편해져요.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="flex-1 text-xs bg-brand-600 text-white py-1.5 rounded-md hover:bg-brand-700 transition-colors"
          >
            설치하기
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-gray-500 px-3 py-1.5 hover:text-gray-700 transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  )
}
