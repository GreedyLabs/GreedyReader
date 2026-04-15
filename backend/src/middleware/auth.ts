import { type Request, type Response, type NextFunction } from 'express'
import { getAuth } from '@clerk/express'

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ message: '인증이 필요합니다' })
    return
  }
  next()
}
