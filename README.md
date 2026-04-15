# GreedyReader

AI 독서노트 웹앱. 책을 기록하고 메모를 남기는 무료 기능과, 독서 DNA 분석·맞춤 도서 추천 등 Claude API 기반 AI 기능(구독 예정)을 제공합니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router |
| Backend | Node.js, Express, TypeScript, Drizzle ORM, SQLite (better-sqlite3) |
| 인증 | Clerk |
| AI | Anthropic Claude API |
| 도서 검색 | 네이버 책 검색 Open API |
| 패키지 관리 | pnpm workspaces (모노레포) |

## 프로젝트 구조

```
GreedyReader/
├── frontend/          # React 앱 (포트 5173)
├── backend/           # Express API 서버 (포트 8000)
├── package.json       # 루트 워크스페이스 스크립트
└── pnpm-workspace.yaml
```

## 로컬 실행

### 사전 준비

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- [Clerk](https://clerk.com) 계정 및 애플리케이션
- [네이버 개발자 센터](https://developers.naver.com) 앱 등록 (검색 > 책 API 활성화)

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd GreedyReader
pnpm install
```

### 2. 환경변수 설정

**`backend/.env`** 파일 생성:

```env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
CLAUDE_API_KEY=           # AI 기능 사용 시 필요
CLAUDE_MODEL=claude-sonnet-4-6
PORT=8000
```

**`frontend/.env.local`** 파일 생성:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:8000
```

> Clerk 키는 [Clerk 대시보드](https://dashboard.clerk.com) → API Keys에서 확인합니다.  
> 네이버 키는 개발자 센터 → 내 애플리케이션 → 앱 선택 후 확인합니다.

### 3. 실행

```bash
# 프론트엔드 + 백엔드 동시 실행
pnpm dev

# 개별 실행
pnpm frontend:dev    # http://localhost:5173
pnpm backend:dev     # http://localhost:8000
```

SQLite DB 파일(`greedy-reader.db`)은 백엔드 서버 최초 실행 시 자동으로 생성됩니다.

### 4. 빌드

```bash
pnpm build
```

## 주요 기능

- **서재 관리** — 책 검색(네이버 API)으로 등록, 읽는 중 / 완독 / 위시리스트 상태 관리
- **독서 기록** — 읽기 시작일, 완독일, 별점 기록
- **메모** — 책별 메모 및 인용구 저장
- **통계** — 독서 현황 통계 (개발 중)
- **AI 기능** — 독서 DNA 분석, 맞춤 도서 추천 (구독, 개발 중)

## API 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| GET | `/health` | 헬스체크 |
| GET | `/api/v1/books` | 서재 목록 조회 |
| POST | `/api/v1/books` | 책 등록 |
| GET | `/api/v1/books/:id` | 책 상세 조회 |
| PATCH | `/api/v1/books/:id` | 책 정보 수정 |
| DELETE | `/api/v1/books/:id` | 책 삭제 |
| GET | `/api/v1/books/:id/memos` | 메모 목록 |
| POST | `/api/v1/books/:id/memos` | 메모 추가 |
| DELETE | `/api/v1/books/:id/memos/:memoId` | 메모 삭제 |
| GET | `/api/v1/search/books?query=` | 도서 검색 |

## 기타

```bash
# DB 스튜디오 (테이블 시각적으로 확인)
pnpm --filter @greedy-reader/backend run db:studio
```
