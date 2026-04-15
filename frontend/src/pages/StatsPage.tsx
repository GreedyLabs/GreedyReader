export default function StatsPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">독서 통계</h2>
      <p className="text-sm text-gray-500 mb-8">나의 독서 패턴을 확인하세요</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '올해 완독', value: '12권', icon: '📚' },
          { label: '이달 독서시간', value: '24시간', icon: '⏱️' },
          { label: '평균 별점', value: '4.2', icon: '⭐' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-200 p-5 text-center"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-400 text-center py-8">
          통계 차트는 추후 구현 예정입니다
        </p>
      </div>
    </div>
  )
}
