import { Router } from 'express'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { getAuth } from '@clerk/express'
import { db } from '../db/index.js'
import { books } from '../db/schema.js'

export const booksRouter = Router()

const CreateBookSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().min(1).max(200),
  coverUrl: z.string().url().optional(),
  isbn: z.string().max(20).optional(),
  publisher: z.string().max(200).optional(),
  pubdate: z.string().max(8).optional(),
  description: z.string().max(5000).optional(),
  genre: z.string().max(50).optional(),
  status: z.enum(['reading', 'completed', 'wish']).default('wish'),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  rating: z.number().int().min(1).max(5).optional(),
})

const UpdateBookSchema = CreateBookSchema.partial()

// GET /api/v1/books
booksRouter.get('/', (req, res) => {
  const { userId } = getAuth(req)
  const result = db
    .select()
    .from(books)
    .where(eq(books.userId, userId!))
    .all()
  res.json({ data: result })
})

// GET /api/v1/books/:id
booksRouter.get('/:id', (req, res) => {
  const { userId } = getAuth(req)
  const book = db
    .select()
    .from(books)
    .where(and(eq(books.id, req.params.id), eq(books.userId, userId!)))
    .get()

  if (!book) {
    res.status(404).json({ message: '책을 찾을 수 없습니다' })
    return
  }
  res.json({ data: book })
})

// POST /api/v1/books
booksRouter.post('/', (req, res) => {
  const { userId } = getAuth(req)
  const parsed = CreateBookSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: '유효하지 않은 데이터', errors: parsed.error.flatten() })
    return
  }

  const now = new Date().toISOString()
  const book = db
    .insert(books)
    .values({ id: randomUUID(), userId: userId!, ...parsed.data, createdAt: now, updatedAt: now })
    .returning()
    .get()

  res.status(201).json({ data: book })
})

// PATCH /api/v1/books/:id
booksRouter.patch('/:id', (req, res) => {
  const { userId } = getAuth(req)
  const existing = db
    .select()
    .from(books)
    .where(and(eq(books.id, req.params.id), eq(books.userId, userId!)))
    .get()

  if (!existing) {
    res.status(404).json({ message: '책을 찾을 수 없습니다' })
    return
  }

  const parsed = UpdateBookSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: '유효하지 않은 데이터', errors: parsed.error.flatten() })
    return
  }

  const updated = db
    .update(books)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(books.id, req.params.id))
    .returning()
    .get()

  res.json({ data: updated })
})

// DELETE /api/v1/books/:id
booksRouter.delete('/:id', (req, res) => {
  const { userId } = getAuth(req)
  const existing = db
    .select()
    .from(books)
    .where(and(eq(books.id, req.params.id), eq(books.userId, userId!)))
    .get()

  if (!existing) {
    res.status(404).json({ message: '책을 찾을 수 없습니다' })
    return
  }

  db.delete(books).where(eq(books.id, req.params.id)).run()
  res.status(204).send()
})
