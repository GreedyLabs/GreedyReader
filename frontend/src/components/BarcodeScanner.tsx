import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'

const ISBN_PATTERN = /^97[89]\d{10}$/

type ScanState = 'starting' | 'scanning' | 'error'

interface Props {
  onDetect: (isbn: string) => void
  onClose: () => void
}

// 네이티브 BarcodeDetector API 타입 (Chrome 83+, Samsung Internet 13+)
interface BarcodeDetectorResult {
  rawValue: string
  format: string
}
interface NativeBarcodeDetector {
  detect(image: HTMLVideoElement): Promise<BarcodeDetectorResult[]>
}
declare const BarcodeDetector: {
  new (options?: { formats: string[] }): NativeBarcodeDetector
}

const hasNativeBarcodeDetector = () => 'BarcodeDetector' in window

export default function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const onDetectRef = useRef(onDetect)
  const [state, setState] = useState<ScanState>('starting')
  const [errorMsg, setErrorMsg] = useState('')

  // 렌더마다 최신 콜백 유지 (effect 재시작 없이)
  onDetectRef.current = onDetect

  useEffect(() => {
    let stopped = false
    let rafId: number
    let mediaStream: MediaStream | null = null

    // ── 방법 1: 네이티브 BarcodeDetector (Samsung Internet 13+, Chrome 83+)
    async function startNativeDetector() {
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128'] })

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      mediaStream = stream

      if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
      if (!videoRef.current) { stream.getTracks().forEach(t => t.stop()); return }

      videoRef.current.srcObject = stream
      await videoRef.current.play()

      if (!stopped) setState('scanning')

      // 같은 값이 연속 2회 감지돼야 확정 (흔들림·블러로 인한 오독 방지)
      let lastValue = ''
      let hitCount = 0
      let detecting = false

      const scan = async () => {
        if (stopped || !videoRef.current || detecting) return
        detecting = true
        try {
          const barcodes = await detector.detect(videoRef.current)
          let matched = false
          for (const barcode of barcodes) {
            if (ISBN_PATTERN.test(barcode.rawValue)) {
              matched = true
              if (barcode.rawValue === lastValue) {
                hitCount++
                if (hitCount >= 2) {
                  stopped = true
                  onDetectRef.current(barcode.rawValue)
                  return
                }
              } else {
                lastValue = barcode.rawValue
                hitCount = 1
              }
              break
            }
          }
          if (!matched) { lastValue = ''; hitCount = 0 }
        } catch { /* 프레임 처리 에러 무시 */ }
        detecting = false
        // 200ms 간격으로 스캔 — 카메라 30fps 기준 6프레임 대기, CPU 절감
        if (!stopped) rafId = window.setTimeout(() => void scan(), 200) as unknown as number
      }

      void scan()
    }

    // ── 방법 2: ZXing 폴백 (네이티브 API 미지원 브라우저)
    async function startZxing() {
      if (!videoRef.current) return
      const reader = new BrowserMultiFormatReader()

      controlsRef.current = await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
          },
        },
        videoRef.current,
        (result, _error) => {
          if (stopped || !result) return
          const text = result.getText()
          if (!ISBN_PATTERN.test(text)) return
          stopped = true
          controlsRef.current?.stop()
          onDetectRef.current(text)
        },
      )

      if (!stopped) setState('scanning')
    }

    async function start() {
      try {
        if (hasNativeBarcodeDetector()) {
          await startNativeDetector()
        } else {
          await startZxing()
        }
      } catch (err) {
        if (stopped) return
        const msg = err instanceof Error ? err.message : String(err)
        const isDenied = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
        setErrorMsg(isDenied ? '카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.' : `카메라를 시작할 수 없어요.\n${msg}`)
        setState('error')
      }
    }

    void start()

    return () => {
      stopped = true
      clearTimeout(rafId)
      mediaStream?.getTracks().forEach(t => t.stop())
      controlsRef.current?.stop()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">

      {/* 헤더 */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 bg-gradient-to-b from-black/70 to-transparent">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>
        <p className="text-white text-sm font-medium">책 바코드를 비춰주세요</p>
        <div className="w-9" />
      </div>

      {/* 카메라 뷰 */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {/* 스캔 가이드 오버레이 */}
        {state === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* 어두운 배경 마스크 */}
            <div className="absolute inset-0 bg-black/40" />

            {/* 스캔 영역 */}
            <div className="relative w-72 h-40">
              {/* 코너 마커 */}
              <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />

              {/* 스캔 라인 */}
              <div className="absolute inset-x-0 h-0.5 bg-brand-400 animate-scan-line" />
            </div>
          </div>
        )}

        {/* 시작 중 */}
        {state === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white text-sm">카메라 준비 중...</p>
          </div>
        )}

        {/* 에러 */}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 bg-black/80">
            <span className="text-4xl">📷</span>
            <p className="text-white text-sm text-center whitespace-pre-line">{errorMsg}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white text-gray-900 text-sm font-semibold rounded-full"
            >
              닫기
            </button>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      {state === 'scanning' && (
        <div className="py-6 bg-gradient-to-t from-black/70 to-transparent flex flex-col items-center gap-1">
          <p className="text-white/70 text-xs">책 뒷면 바코드(ISBN)에 맞춰주세요</p>
        </div>
      )}
    </div>
  )
}
