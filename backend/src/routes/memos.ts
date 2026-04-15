import { Router, type Request, type Response } from 'express'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { getAuth } from '@clerk/express'
import { db } from '../db/index.js'
import { books, memos } from '../db/schema.js'

export const memosRouter = Router({ mergeParams: true })

type BookParams = { bookId: string }
type MemoParams = { bookId: string; id: string }

const CreateMemoSchema = z.object({
  content: z.string().min(1).max(2000),
  highlight: z.string().max(1000).optional(),
  page: z.number().int().min(1).optional(),
})

function getBook(bookId: string, userId: string) {
  return db
    .select()
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId)))
    .get()
}

// GET /api/v1/books/:bookId/memos
memosRouter.get('/', (req: Request<BookParams>, res: Response) => {
  const { userId } = getAuth(req)
  if (!getBook(req.params.bookId, userId!)) {
    res.status(404).json({ message: '책을 찾을 수 없습니다' })
    return
  }

  const result = db
    .select()
    .from(memos)
    .where(eq(memos.bookId, req.params.bookId))
    .all()

  res.json({ data: result })
})

// POST /api/v1/books/:bookId/memos
memosRouter.post('/', (req: Request<BookParams>, res: Response) => {
  const { userId } = getAuth(req)
  if (!getBook(req.params.bookId, userId!)) {
    res.status(404).json({ message: '책을 찾을 수 없습니다' })
    return
  }

  const parsed = CreateMemoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: '유효하지 않은 데이터', errors: parsed.error.flatten() })
    return
  }

  const now = new Date().toISOString()

  const memo = db
    .insert(memos)
    .values({ id: randomUUID(), bookId: req.params.bookId, ...parsed.data, createdAt: now })
    .returning()
    .get()

  // 책의 lastMemoAt 갱신 — "최근 메모순" 정렬에 활용
  db.update(books)
    .set({ lastMemoAt: now })
    .where(eq(books.id, req.params.bookId))
    .run()

  res.status(201).json({ data: memo })
})

// DELETE /api/v1/books/:bookId/memos/:id
memosRouter.delete('/:id', (req: Request<MemoParams>, res: Response) => {
  const { userId } = getAuth(req)
  if (!getBook(req.params.bookId, userId!)) {
    res.status(404).json({ message: '책을 찾을 수 없습니다' })
    return
  }

  const memo = db
    .select()
    .from(memos)
    .where(and(eq(memos.id, req.params.id), eq(memos.bookId, req.params.bookId)))
    .get()

  if (!memo) {
    res.status(404).json({ message: '메모를 찾을 수 없습니다' })
    return
  }

  db.delete(memos).where(eq(memos.id, req.params.id)).run()
  res.status(204).send()
})
