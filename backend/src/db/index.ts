import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.js'

const sqlite = new Database('./greedy-reader.db')

// WAL 모드: 읽기/쓰기 동시성 향상 (SQLite 권장 설정)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// 컬럼 추가 마이그레이션 (이미 존재하면 무시)
const addColumn = (sql: string) => {
  try { sqlite.prepare(sql).run() } catch { /* already exists */ }
}
addColumn('ALTER TABLE books ADD COLUMN isbn TEXT')
addColumn('ALTER TABLE books ADD COLUMN publisher TEXT')
addColumn('ALTER TABLE books ADD COLUMN pubdate TEXT')
addColumn('ALTER TABLE books ADD COLUMN description TEXT')

export const db = drizzle(sqlite, { schema })
