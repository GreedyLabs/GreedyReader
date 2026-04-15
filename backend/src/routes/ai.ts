import { Router, type Request, type Response, type NextFunction } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { rateLimitMiddleware } from '../middleware/rateLimiter.js'

export const aiRouter = Router()

const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6'

// 비용 제어 상수 — 한 곳에서 관리
const LIMITS = {
  CHAT_MAX_INPUT_CHARS: 1500,    // 사용자 메시지 최대 글자수
  CHAT_MAX_HISTORY: 20,          // Claude에게 전달할 최대 메시지 수
  CHAT_MAX_TOKENS: 1024,         // Claude 응답 최대 토큰
  SUMMARIZE_MAX_MEMO_CHARS: 500, // 메모 1개 최대 글자수
  SUMMARIZE_MAX_MEMOS: 20,       // 한 번에 정리할 최대 메모 수
  SUMMARIZE_MAX_TOKENS: 1500,    // Claude 응답 최대 토큰
  DAILY_CHAT_LIMIT: 30,          // 하루 채팅 요청 횟수
  DAILY_SUMMARIZE_LIMIT: 10,     // 하루 요약 요청 횟수
} as const

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

// 구독 상태 확인 미들웨어 (추후 실제 DB 조회로 교체)
function requirePro(req: Request, res: Response, next: NextFunction) {
  const isPro = req.headers['x-subscription-tier'] === 'pro'
  if (!isPro) {
    res.status(403).json({ message: 'Pro 구독이 필요한 기능입니다' })
    return
  }
  next()
}

const ChatSchema = z.object({
  bookTitle: z.string().min(1).max(200),
  bookAuthor: z.string().max(100).optional(),
  // 사용자가 저장한 메모/하이라이트 — 책 내용의 "진실의 원천"
  // Claude가 책을 모르거나 할루시네이션해도 메모 기반으로 대화 가능
  memos: z
    .array(z.string().max(LIMITS.SUMMARIZE_MAX_MEMO_CHARS))
    .max(10) // 채팅 컨텍스트엔 최근 10개만
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(LIMITS.CHAT_MAX_INPUT_CHARS),
      }),
    )
    .min(1),
})

const SummarizeSchema = z.object({
  bookTitle: z.string().min(1).max(200),
  memos: z
    .array(z.string().min(1).max(LIMITS.SUMMARIZE_MAX_MEMO_CHARS))
    .min(1)
    .max(LIMITS.SUMMARIZE_MAX_MEMOS),
})

// POST /api/v1/ai/chat — 책 토론 (스트리밍)
aiRouter.post(
  '/chat',
  requirePro,
  rateLimitMiddleware({
    limit: LIMITS.DAILY_CHAT_LIMIT,
    windowMs: 1000 * 60 * 60 * 24, // 24시간
    keyPrefix: 'ai:chat',
  }),
  async (req, res) => {
    const parsed = ChatSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        message: '유효하지 않은 데이터',
        errors: parsed.error.flatten(),
        limits: { maxInputChars: LIMITS.CHAT_MAX_INPUT_CHARS },
      })
      return
    }

    const { bookTitle, bookAuthor, memos, messages } = parsed.data

    const trimmedMessages =
      messages.length > LIMITS.CHAT_MAX_HISTORY
        ? messages.slice(-LIMITS.CHAT_MAX_HISTORY)
        : messages

    const authorInfo = bookAuthor ? ` (저자: ${bookAuthor})` : ''
    const memoContext =
      memos && memos.length > 0
        ? `\n\n사용자가 이 책을 읽으며 남긴 메모:\n${memos.map((m, i) => `[메모 ${i + 1}] ${m}`).join('\n')}\n\n이 메모는 책 내용을 대체하는 게 아니라, 사용자가 어떤 부분에 관심을 가졌는지 보여주는 단서입니다. 대화 주제를 잡을 때 참고하세요.`
        : ''

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    try {
      const stream = client.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: LIMITS.CHAT_MAX_TOKENS,
        system: `당신은 박식한 독서 토론 파트너입니다. 사용자가 "${bookTitle}"${authorInfo}를 읽고 있습니다.${memoContext}

당신의 역할:
- 당신 자신이 아는 책 지식(주제, 문체, 인물, 작가 의도, 문학적 맥락 등)을 바탕으로 깊이 있는 토론을 이끄세요.
- 사용자의 메모가 있다면, 그 사람이 어떤 부분에 꽂혔는지 파악해 대화의 방향을 맞춤화하세요.

할루시네이션 방지 규칙 (반드시 지킬 것):
- 특정 구절이나 인용문을 인용할 때, 정확하지 않으면 지어내지 말고 "정확한 표현은 기억나지 않지만, 대략 이런 내용이었어요" 라고 하세요.
- 이 책을 잘 모른다면 솔직하게 "이 책은 제가 잘 알지 못해서, 읽으신 내용을 먼저 얘기해 주시면 함께 분석해 드릴게요" 라고 말하세요.
- 모르는 걸 아는 척하는 것보다 솔직한 게 훨씬 낫습니다.

한국어로, 친근하고 지적인 톤으로 답변하세요. 핵심만 간결하게.`,
        messages: trimmedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
        }
      }

      res.write('data: [DONE]\n\n')
      res.end()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 서비스 오류'
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`)
      res.end()
    }
  },
)

// POST /api/v1/ai/summarize — 메모 AI 정리
aiRouter.post(
  '/summarize',
  requirePro,
  rateLimitMiddleware({
    limit: LIMITS.DAILY_SUMMARIZE_LIMIT,
    windowMs: 1000 * 60 * 60 * 24, // 24시간
    keyPrefix: 'ai:summarize',
  }),
  async (req, res) => {
    const parsed = SummarizeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        message: '유효하지 않은 데이터',
        errors: parsed.error.flatten(),
        limits: {
          maxMemos: LIMITS.SUMMARIZE_MAX_MEMOS,
          maxMemoChars: LIMITS.SUMMARIZE_MAX_MEMO_CHARS,
        },
      })
      return
    }

    const { bookTitle, memos } = parsed.data

    try {
      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: LIMITS.SUMMARIZE_MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: `"${bookTitle}"에 대해 아래 메모들을 체계적으로 정리해 주세요.

메모:
${memos.map((m, i) => `${i + 1}. ${m}`).join('\n')}

다음 형식으로 정리해 주세요:
1. 핵심 인사이트 (3-5개)
2. 기억할 문장/구절
3. 개인 성찰 포인트
4. 연관 도서 추천 (1-2권)`,
          },
        ],
      })

      const content = response.content[0]
      if (content.type !== 'text') {
        res.status(500).json({ message: '응답 처리 오류' })
        return
      }

      res.json({ data: { summary: content.text } })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 서비스 오류'
      res.status(500).json({ message })
    }
  },
)
