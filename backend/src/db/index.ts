import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.js'

const sqlite = new Database('./greedy-reader.db')

// WAL 모드: 읽기/쓰기 동시성 향상 (SQLite 권장 설정)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// 테이블 초기 생성 (운영 환경 최초 실행 시 자동 생성)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT,
    isbn TEXT,
    publisher TEXT,
    pubdate TEXT,
    description TEXT,
    genre TEXT,
    status TEXT NOT NULL DEFAULT 'wish',
    rating INTEGER,
    start_date TEXT,
    end_date TEXT,
    last_memo_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memos (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    highlight TEXT,
    page INTEGER,
    created_at TEXT NOT NULL
  );
`)

// 컬럼 추가 마이그레이션 (이미 존재하면 무시)
const addColumn = (sql: string) => {
  try { sqlite.prepare(sql).run() } catch { /* already exists */ }
}
addColumn('ALTER TABLE books ADD COLUMN isbn TEXT')
addColumn('ALTER TABLE books ADD COLUMN publisher TEXT')
addColumn('ALTER TABLE books ADD COLUMN pubdate TEXT')
addColumn('ALTER TABLE books ADD COLUMN description TEXT')

export const db = drizzle(sqlite, { schema })
