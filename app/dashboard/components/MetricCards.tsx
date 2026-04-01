import { Card, CardContent } from '@/components/ui/card'

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
  const metrics = [
    {
      label: '시청자 수',
      value: viewerCount.toLocaleString(),
      suffix: '명',
      sub: null,
    },
    {
      label: '평균 시청 시간',
      value: `${avgWatchTime}`,
      suffix: '초',
      sub: `영상의 ${avgWatchPercent.toFixed(1)}%`,
    },
    {
      label: '초반 10초 이탈률',
      value: earlyDropRate.toFixed(1),
      suffix: '%',
      sub: earlyDropRate > 30 ? '개선 필요' : null,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {metrics.map((m) => (
        <Card key={m.label} className="bg-white border-border/60 shadow-none hover:shadow-sm transition-shadow">
          <CardContent className="pt-5 pb-5 px-6">
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
              {m.label}
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-[32px] font-bold tracking-tight text-foreground leading-none">
                {m.value}
              </span>
              <span className="text-[14px] font-medium text-muted-foreground">
                {m.suffix}
              </span>
            </div>
            {m.sub && (
              <p className="mt-1.5 text-[12px] text-muted-foreground">
                {m.sub}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
