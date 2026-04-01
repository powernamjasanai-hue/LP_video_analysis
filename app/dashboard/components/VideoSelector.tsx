'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface VideoInfo {
  video_id: string
  title: string
  project_name?: string | null
}

export default function VideoSelector({ videos }: { videos: VideoInfo[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('videoId') || videos[0]?.video_id || ''
  const [open, setOpen] = useState(false)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const currentVideo = videos.find((v) => v.video_id === current)

  // 프로젝트별 그룹화
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

  function selectVideo(videoId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('videoId', videoId)
    router.push(`/dashboard?${params.toString()}`)
    setOpen(false)
  }

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (videos.length === 0) {
    return (
      <div className="h-9 px-3 flex items-center rounded-md border border-input bg-white text-[13px] text-muted-foreground">
        영상을 등록해주세요
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      {/* 트리거 */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 h-9 w-[300px] px-3 rounded-md border border-input bg-white text-[13px] text-left hover:bg-muted/50 transition-colors"
      >
        <span className="truncate text-foreground">
          {currentVideo?.title || current}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute top-10 right-0 z-50 w-[320px] bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto py-1">
            {groupKeys.map((group) => (
              <div key={group}>
                {/* 프로젝트 헤더 */}
                <button
                  onClick={() => setExpandedProject(expandedProject === group ? null : group)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className={`text-muted-foreground transition-transform ${expandedProject === group ? 'rotate-0' : '-rotate-90'}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">
                    {grouped[group].length}
                  </span>
                </button>

                {/* 영상 목록 */}
                {expandedProject === group && (
                  <div>
                    {grouped[group].map((v) => (
                      <button
                        key={v.video_id}
                        onClick={() => selectVideo(v.video_id)}
                        className={`w-full flex items-center gap-2.5 px-3 pl-7 py-2 text-left hover:bg-muted/50 transition-colors ${
                          v.video_id === current ? 'bg-muted' : ''
                        }`}
                      >
                        {v.video_id === current && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0 text-foreground">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span className={`text-[13px] truncate ${v.video_id === current ? 'font-medium text-foreground' : 'text-foreground/80'}`}>
                          {v.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
