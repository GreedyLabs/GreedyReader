import { type Request, type Response, type NextFunction } from 'express'

interface RateEntry {
  count: number
  resetAt: number // epoch ms
}

// 인메모리 스토어 — 서버 재시작 시 초기화됨
// 추후 Redis로 교체하면 다중 서버 환경에서도 동작
const store = new Map<string, RateEntry>()

// 오래된 항목 주기적으로 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 1000 * 60 * 10) // 10분마다

interface RateLimitOptions {
  limit: number
  windowMs: number
  keyPrefix?: string
}

export function rateLimitMiddleware(options: RateLimitOptions) {
  const { limit, windowMs, keyPrefix = 'rl' } = options

  return (req: Request, res: Response, next: NextFunction) => {
    // 추후 인증 미들웨어에서 req.user.id 를 쓸 수 있게 되면 교체
    const userId = (req.headers['x-user-id'] as string) ?? req.ip ?? 'anonymous'
    const key = `${keyPrefix}:${userId}`
    const now = Date.now()

    const entry = store.get(key)

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      setRateLimitHeaders(res, limit, limit - 1, now + windowMs)
      next()
      return
    }

    if (entry.count >= limit) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
      res.setHeader('Retry-After', retryAfterSec)
      setRateLimitHeaders(res, limit, 0, entry.resetAt)
      res.status(429).json({
        message: `일일 AI 사용 한도(${limit}회)에 도달했습니다.`,
        resetAt: new Date(entry.resetAt).toISOString(),
      })
      return
    }

    entry.count++
    setRateLimitHeaders(res, limit, limit - entry.count, entry.resetAt)
    next()
  }
}

function setRateLimitHeaders(
  res: Response,
  limit: number,
  remaining: number,
  resetAt: number,
) {
  res.setHeader('X-RateLimit-Limit', limit)
  res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining))
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000))
}
