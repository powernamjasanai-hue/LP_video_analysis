'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

const PERIODS = [
  { label: '7일', value: '7d' },
  { label: '30일', value: '30d' },
  { label: '전체', value: 'all' },
]

export default function DateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('period') || '30d'

  function onClick(period: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', period)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 bg-muted rounded-lg p-0.5">
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          variant={current === p.value ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onClick(p.value)}
          className={`h-7 px-3 text-[12px] font-medium rounded-md transition-all ${
            current === p.value
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {p.label}
        </Button>
      ))}
    </div>
  )
}
