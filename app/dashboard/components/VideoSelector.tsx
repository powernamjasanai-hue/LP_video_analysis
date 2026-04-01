'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function VideoSelector({ videoIds }: { videoIds: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('videoId') || videoIds[0] || ''

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('videoId', value)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-9 text-[13px] bg-white">
        <SelectValue placeholder="영상 선택" />
      </SelectTrigger>
      <SelectContent>
        {videoIds.map((id) => (
          <SelectItem key={id} value={id} className="text-[13px]">
            {id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
