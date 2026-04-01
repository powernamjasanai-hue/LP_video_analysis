'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface BucketData {
  bucket: string
  rate: number
}

export default function DropOffChart({ data }: { data: BucketData[] }) {
  if (data.length === 0) {
    return (
      <Card className="bg-white border-border/60 shadow-none">
        <CardContent className="py-12 text-center">
          <p className="text-[13px] text-muted-foreground">데이터가 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-border/60 shadow-none hover:shadow-sm transition-shadow">
      <CardHeader className="pb-2 px-6 pt-5">
        <CardTitle className="text-[14px] font-semibold text-foreground">
          시청 구간별 이탈률
        </CardTitle>
        <p className="text-[12px] text-muted-foreground">
          10초 단위 구간에서 이탈한 비율
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000000" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#000000" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="none"
              stroke="#f0f0f0"
              vertical={false}
            />
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 11, fill: '#999' }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#999' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              dx={-4}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e5e5',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                padding: '8px 12px',
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, '이탈률']}
              labelFormatter={(label) => `${label}초`}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#000000"
              strokeWidth={1.5}
              fill="url(#fillRate)"
              dot={{ r: 3, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
