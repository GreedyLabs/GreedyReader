import express from 'express'
import cors from 'cors'
import { clerkMiddleware } from '@clerk/express'
import { requireAuth } from './middleware/auth.js'
import { healthRouter } from './routes/health.js'
import { booksRouter } from './routes/books.js'
import { memosRouter } from './routes/memos.js'
import { searchRouter } from './routes/search.js'
import { aiRouter } from './routes/ai.js'

export function createApp() {
  const app = express()

  // 개발 중 Vite가 5173 대신 5174 등을 쓸 수 있어서 localhost는 모두 허용
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : [/^http:\/\/localhost:\d+$/]
  app.use(cors({ origin: allowedOrigins }))
  app.use(express.json())

  // Clerk: 모든 요청에서 토큰을 파싱해 req.auth 에 붙여줌
  app.use(clerkMiddleware())

  app.use('/health', healthRouter)

  app.use('/api/v1/search', requireAuth, searchRouter)
  app.use('/api/v1/books', requireAuth, booksRouter)
  app.use('/api/v1/books/:bookId/memos', requireAuth, memosRouter)
  app.use('/api/v1/ai', requireAuth, aiRouter)

  app.use((_req, res) => {
    res.status(404).json({ message: '요청한 경로를 찾을 수 없습니다' })
  })

  return app
}
