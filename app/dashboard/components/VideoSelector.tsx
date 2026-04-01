'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface VideoInfo {
  video_id: string
  title: string
  thumbnail_url?: string
}

export default function VideoSelector({ videos }: { videos: VideoInfo[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('videoId') || videos[0]?.video_id || ''

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('videoId', value)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[280px] h-9 text-[13px] bg-white">
        <SelectValue placeholder="영상 선택" />
      </SelectTrigger>
      <SelectContent>
        {videos.map((v) => (
          <SelectItem key={v.video_id} value={v.video_id} className="text-[13px]">
            <span className="truncate">{v.title || v.video_id}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
