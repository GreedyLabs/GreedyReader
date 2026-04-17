import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // 추후 인증 연동 시 사용
  title: text('title').notNull(),
  author: text('author').notNull(),
  coverUrl: text('cover_url'),
  isbn: text('isbn'),
  publisher: text('publisher'),
  pubdate: text('pubdate'),   // YYYYMMDD
  description: text('description'),
  genre: text('genre'),
  status: text('status', { enum: ['reading', 'completed', 'wish'] })
    .notNull()
    .default('wish'),
  rating: integer('rating'), // 1–5
  readCount: integer('read_count').notNull().default(1), // 몇 번째 읽기인지
  startDate: text('start_date'), // ISO date (YYYY-MM-DD)
  endDate: text('end_date'),
  lastMemoAt: text('last_memo_at'), // 가장 최근 메모 작성 시각 (메모 추가 시 자동 갱신)
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

export const memos = sqliteTable('memos', {
  id: text('id').primaryKey(),
  bookId: text('book_id')
    .notNull()
    .references(() => books.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  highlight: text('highlight'), // 책에서 직접 인용한 원문
  page: integer('page'),
  createdAt: text('created_at').notNull(),
})

export type Book = typeof books.$inferSelect
export type NewBook = typeof books.$inferInsert
export type Memo = typeof memos.$inferSelect
export type NewMemo = typeof memos.$inferInsert
