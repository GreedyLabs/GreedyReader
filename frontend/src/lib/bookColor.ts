// 책 제목 기반으로 일관된 커버 색상 생성
// 실제 표지 이미지 없이도 각 책이 고유한 색을 가짐

const PALETTES = [
  { bg: '#1B4332', text: '#D8F3DC' }, // 딥 그린
  { bg: '#581C87', text: '#F3E8FF' }, // 딥 퍼플
  { bg: '#7C2D12', text: '#FEF3C7' }, // 브릭 레드
  { bg: '#1E3A5F', text: '#DBEAFE' }, // 네이비
  { bg: '#713F12', text: '#FEF9C3' }, // 앰버
  { bg: '#3B0764', text: '#FAE8FF' }, // 바이올렛
  { bg: '#064E3B', text: '#D1FAE5' }, // 에메랄드
  { bg: '#450A0A', text: '#FFE4E6' }, // 딥 로즈
  { bg: '#1C1917', text: '#E7E5E4' }, // 차콜
  { bg: '#0C4A6E', text: '#E0F2FE' }, // 딥 스카이
]

export function getBookColor(title: string) {
  // 제목 글자 코드의 합으로 인덱스 결정 → 항상 같은 색
  const sum = title.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return PALETTES[sum % PALETTES.length]
}
