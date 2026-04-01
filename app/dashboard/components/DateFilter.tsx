'use client'

import { useRouter, useSearchParams } from 'next/navigation'

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
    <div className="flex gap-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onClick(p.value)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            current === p.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
