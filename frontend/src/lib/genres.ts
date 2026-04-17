export const GENRE_GROUPS = ['소설', '비소설'] as const
export type GenreGroup = (typeof GENRE_GROUPS)[number]

export const GENRES = [
  // 소설
  { id: 'NOVEL',            label: '일반소설',    color: '#6d28d9', group: '소설' as GenreGroup },
  { id: 'SF_FANTASY',       label: 'SF/판타지',  color: '#7c3aed', group: '소설' as GenreGroup },
  { id: 'MYSTERY_THRILLER', label: '추리/스릴러', color: '#1e3a5f', group: '소설' as GenreGroup },
  { id: 'ROMANCE',          label: '로맨스',      color: '#be185d', group: '소설' as GenreGroup },
  { id: 'HORROR',           label: '공포/호러',   color: '#374151', group: '소설' as GenreGroup },
  // 비소설
  { id: 'ESSAY',            label: '에세이',      color: '#2563eb', group: '비소설' as GenreGroup },
  { id: 'SELF_HELP',        label: '자기계발',    color: '#059669', group: '비소설' as GenreGroup },
  { id: 'BUSINESS',         label: '경제/경영',   color: '#d97706', group: '비소설' as GenreGroup },
  { id: 'HUMANITIES',       label: '인문/역사',   color: '#dc2626', group: '비소설' as GenreGroup },
  { id: 'SCIENCE_TECH',     label: '과학/기술',   color: '#0891b2', group: '비소설' as GenreGroup },
  { id: 'ARTS_CULTURE',     label: '예술/문화',   color: '#db2777', group: '비소설' as GenreGroup },
  { id: 'OTHER',            label: '기타',        color: '#6b7280', group: '비소설' as GenreGroup },
] as const

export type GenreId = (typeof GENRES)[number]['id']

export const GENRE_LABEL: Record<GenreId, string> = Object.fromEntries(
  GENRES.map((g) => [g.id, g.label]),
) as Record<GenreId, string>

export const GENRE_COLOR: Record<GenreId, string> = Object.fromEntries(
  GENRES.map((g) => [g.id, g.color]),
) as Record<GenreId, string>

// 장르별 키워드 — 구체적인 장르(SF·추리·로맨스)를 일반 소설보다 앞에 배치해
// 점수 경쟁 시 더 세분화된 장르가 우선 선택되도록 함
const GENRE_KEYWORDS: Record<GenreId, string[]> = {
  SF_FANTASY:       ['SF 소설', 'SF 고전', '공상과학', 'SF', '판타지', '로봇', '우주선', '우주', '외계인', '외계', '마법', '이세계', '세계관', '디스토피아', '사이버', '드래곤', '마법사'],
  MYSTERY_THRILLER: ['추리', '미스터리', '스릴러', '살인', '범죄', '탐정', '형사', '범인', '사건을 해결', '용의자'],
  ROMANCE:          ['로맨스', '설레는', '사랑 이야기', '연애', '두 남녀', '감동적인 사랑'],
  HORROR:           ['공포', '호러', '괴물', '귀신', '유령', '좀비', '공포소설', '오싹', '섬뜩', '악령', '저주'],
  NOVEL:            ['소설', '장편', '단편', '주인공', '등장인물', '서사', '픽션', '이야기를 담'],
  ESSAY:            ['에세이', '수필', '산문', '일상을', '단상', '소소한'],
  SELF_HELP:        ['자기계발', '습관', '성공 법칙', '잠재력', '멘탈', '마인드셋', '루틴', '동기부여'],
  BUSINESS:         ['경영', '경제학', '투자', '주식', '재테크', '비즈니스', '스타트업', '마케팅', '리더십', '금융', '자산'],
  HUMANITIES:       ['역사', '인문', '철학', '문명', '사상', '고대', '왕조', '제국', '전쟁사', '인류'],
  SCIENCE_TECH:     ['프로그래밍', '코딩', '인공지능', '물리학', '생물학', '뇌과학', '수학', '데이터 분석', '과학책', '과학 도서'],
  ARTS_CULTURE:     ['예술', '음악', '미술', '영화', '디자인', '건축', '사진', '공연'],
  OTHER:            [],
}

/** description + title 텍스트에서 장르 ID를 추론합니다. 매칭 없으면 undefined 반환 */
export function detectGenre(description: string, title: string): GenreId | undefined {
  const text = (title + ' ' + description).toLowerCase()

  let best: GenreId | undefined
  let bestScore = 0

  for (const [id, keywords] of Object.entries(GENRE_KEYWORDS) as [GenreId, string[]][]) {
    if (keywords.length === 0) continue
    const score = keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0)
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }

  return bestScore > 0 ? best : undefined
}
