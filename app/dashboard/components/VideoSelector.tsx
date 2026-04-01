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
  project_name?: string | null
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

  // 프로젝트별로 그룹화
  const grouped: Record<string, VideoInfo[]> = {}
  videos.forEach((v) => {
    const key = v.project_name || '미분류'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(v)
  })

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '미분류') return 1
    if (b === '미분류') return -1
    return a.localeCompare(b)
  })

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[300px] h-9 text-[13px] bg-white">
        <SelectValue placeholder="영상 선택" />
      </SelectTrigger>
      <SelectContent>
        {groupKeys.map((group) => (
          <div key={group}>
            <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {group}
            </div>
            {grouped[group].map((v) => (
              <SelectItem key={v.video_id} value={v.video_id} className="text-[13px] pl-4">
                <span className="truncate">{v.title || v.video_id}</span>
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  )
}
