import { Router } from 'express'

export const searchRouter = Router()

const NAVER_CLIENT_ID     = process.env.NAVER_CLIENT_ID ?? ''
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET ?? ''

interface NaverBookItem {
  title: string
  link: string
  image: string
  author: string
  price: string
  discount: string
  publisher: string
  pubdate: string  // YYYYMMDD
  isbn: string     // 공백으로 구분된 ISBN-10, ISBN-13
  description: string
}

interface NaverBookResponse {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverBookItem[]
}

// 네이버 응답에 포함된 <b> 등 HTML 태그 제거
function stripHtml(str: string) {
  return str.replace(/<[^>]*>/g, '').trim()
}

// GET /api/v1/search/books?query=파친코
searchRouter.get('/books', async (req, res) => {
  const query = req.query.query

  if (!query || typeof query !== 'string' || query.trim().length < 1) {
    res.status(400).json({ message: '검색어를 입력해주세요' })
    return
  }

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    res.status(503).json({ message: 'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수를 설정해주세요' })
    return
  }

  const start   = Math.max(1, parseInt(String(req.query.start  ?? '1'),  10) || 1)
  const display = Math.min(10, Math.max(1, parseInt(String(req.query.display ?? '10'), 10) || 10))

  try {
    const url = new URL('https://openapi.naver.com/v1/search/book.json')
    url.searchParams.set('query',   query.trim())
    url.searchParams.set('display', String(display))
    url.searchParams.set('start',   String(start))
    url.searchParams.set('sort',    'sim')

    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id':     NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    })

    if (!response.ok) {
      throw new Error(`Naver API ${response.status}`)
    }

    const data = (await response.json()) as NaverBookResponse

    const books = data.items.map((item) => ({
      title:       stripHtml(item.title),
      author:      stripHtml(item.author),
      publisher:   stripHtml(item.publisher),
      coverUrl:    item.image,
      // isbn 필드는 "ISBN-10 ISBN-13" 형태 — 13자리를 우선 사용
      isbn:        item.isbn.split(' ').find((s) => s.length === 13) ?? item.isbn.split(' ')[0],
      description: stripHtml(item.description),
      pubdate:     item.pubdate, // YYYYMMDD
    }))

    res.json({ data: books, total: data.total, start: data.start, display: data.display })
  } catch (err) {
    const message = err instanceof Error ? err.message : '검색 중 오류가 발생했습니다'
    res.status(500).json({ message })
  }
})
