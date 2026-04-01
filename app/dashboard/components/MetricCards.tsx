interface MetricCardsProps {
  viewerCount: number
  avgWatchTime: number
  avgWatchPercent: number
  earlyDropRate: number
}

export default function MetricCards({
  viewerCount,
  avgWatchTime,
  avgWatchPercent,
  earlyDropRate,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-1">시청자 수</p>
        <p className="text-3xl font-bold text-gray-900">{viewerCount.toLocaleString()}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-1">평균 시청 시간</p>
        <p className="text-3xl font-bold text-gray-900">
          {avgWatchTime}초
          <span className="text-lg font-normal text-gray-400 ml-2">
            ({avgWatchPercent.toFixed(1)}%)
          </span>
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-1">초반 10초 이탈률</p>
        <p className="text-3xl font-bold text-gray-900">{earlyDropRate.toFixed(1)}%</p>
      </div>
    </div>
  )
}
