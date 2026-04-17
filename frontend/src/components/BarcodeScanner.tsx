import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

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
interface BarcodeDetectorInstance {
  detect(source: HTMLCanvasElement): Promise<BarcodeDetectorResult[]>
}
interface BarcodeDetectorConstructor {
  new(options?: { formats: string[] }): BarcodeDetectorInstance
}
declare const BarcodeDetector: BarcodeDetectorConstructor

// 스캔 가이드 박스가 화면 중앙에 있으므로 중앙 60%×40%만 크롭
// 바코드가 이미지에서 차지하는 비율이 높아질수록 인식률이 크게 향상됨
function cropFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const sw = video.videoWidth
  const sh = video.videoHeight
  const cw = Math.floor(sw * 0.6)
  const ch = Math.floor(sh * 0.4)
  const cx = Math.floor((sw - cw) / 2)
  const cy = Math.floor((sh - ch) / 2)
  if (canvas.width !== cw) canvas.width = cw
  if (canvas.height !== ch) canvas.height = ch
  ctx.drawImage(video, cx, cy, cw, ch, 0, 0, cw, ch)
}

export default function BarcodeScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectRef = useRef(onDetect)
  const [state, setState] = useState<ScanState>('starting')
  const [errorMsg, setErrorMsg] = useState('')

  onDetectRef.current = onDetect

  useEffect(() => {
    let stopped = false
    let timerId: ReturnType<typeof setTimeout>
    let mediaStream: MediaStream | null = null

    async function openCamera(): Promise<MediaStream> {
      return navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
    }

    async function attachStream(stream: MediaStream) {
      if (!videoRef.current) return false
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      return true
    }

    // ── 방법 1: 네이티브 BarcodeDetector (Samsung Internet 13+, Chrome 83+)
    async function startNativeDetector() {
      let detector: BarcodeDetectorInstance
      try {
        detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8'] })
      } catch {
        // 포맷 미지원 시 전체 포맷으로 폴백
        detector = new BarcodeDetector()
      }

      const stream = await openCamera()
      mediaStream = stream
      if (stopped || !await attachStream(stream)) { stream.getTracks().forEach(t => t.stop()); return }
      if (!stopped) setState('scanning')

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const scan = async () => {
        if (stopped || !videoRef.current) return
        const video = videoRef.current

        if (video.readyState < 2 || video.videoWidth === 0) {
          timerId = setTimeout(scan, 100)
          return
        }

        cropFrame(video, canvas, ctx)

        try {
          const barcodes = await detector.detect(canvas)
          for (const barcode of barcodes) {
            if (ISBN_PATTERN.test(barcode.rawValue)) {
              stopped = true
              onDetectRef.current(barcode.rawValue)
              return
            }
          }
        } catch { /* 프레임 처리 오류 무시 */ }

        timerId = setTimeout(scan, 150)
      }

      // 카메라 안정화 후 스캔 시작
      timerId = setTimeout(scan, 300)
    }

    // ── 방법 2: ZXing canvas 루프 폴백 (BarcodeDetector 미지원 브라우저)
    async function startZxing() {
      if (!videoRef.current) return
      const reader = new BrowserMultiFormatReader()

      const stream = await openCamera()
      mediaStream = stream
      if (stopped || !await attachStream(stream)) { stream.getTracks().forEach(t => t.stop()); return }
      if (!stopped) setState('scanning')

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      const scan = () => {
        if (stopped || !videoRef.current) return
        const video = videoRef.current

        if (video.readyState < 2 || video.videoWidth === 0) {
          timerId = setTimeout(scan, 100)
          return
        }

        cropFrame(video, canvas, ctx)

        try {
          const result = reader.decodeFromCanvas(canvas)
          const text = result.getText()
          if (ISBN_PATTERN.test(text)) {
            stopped = true
            onDetectRef.current(text)
            return
          }
        } catch { /* NotFoundException 등 무시 */ }

        timerId = setTimeout(scan, 150)
      }

      timerId = setTimeout(scan, 300)
    }

    async function start() {
      try {
        if ('BarcodeDetector' in window) {
          await startNativeDetector()
        } else {
          await startZxing()
        }
      } catch (err) {
        if (stopped) return
        const msg = err instanceof Error ? err.message : String(err)
        const isDenied = msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
        setErrorMsg(
          isDenied
            ? '카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.'
            : `카메라를 시작할 수 없어요.\n${msg}`,
        )
        setState('error')
      }
    }

    void start()

    return () => {
      stopped = true
      clearTimeout(timerId)
      mediaStream?.getTracks().forEach(t => t.stop())
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
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative w-72 h-40">
              <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br" />
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
