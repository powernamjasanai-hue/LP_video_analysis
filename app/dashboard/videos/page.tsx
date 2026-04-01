'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Video {
  id: string
  video_id: string
  title: string
  thumbnail_url: string
  channel_name: string
  session_count: number
  created_at: string
}

function extractVideoId(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  return null
}

function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export default function VideosPage() {
  const [url, setUrl] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [error, setError] = useState('')

  const videoId = url ? extractVideoId(url) : null
  const baseUrl = getBaseUrl()
  const snippetOnly = `<script src="${baseUrl}/snippet.js"\n  data-api="${baseUrl}/api/track"\n  async></script>`

  const fetchVideos = useCallback(async () => {
    const res = await fetch('/api/videos')
    const data = await res.json()
    setVideos(data.videos || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  async function registerVideo() {
    if (!videoId) return
    setRegistering(true)
    setError('')
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error === 'already_registered' ? '이미 등록된 영상입니다' : (data.error || '등록 실패'))
    } else {
      setUrl('')
      fetchVideos()
    }
    setRegistering(false)
  }

  async function deleteVideo(vid: string) {
    if (!confirm('이 영상을 삭제할까요? (수집된 시청 데이터는 유지됩니다)')) return
    await fetch('/api/videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: vid }),
    })
    fetchVideos()
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function getFullCode(vid: string) {
    return `<!-- YouTube 영상 -->\n<iframe width="560" height="315"\n  src="https://www.youtube.com/embed/${vid}"\n  frameborder="0"\n  allowfullscreen>\n</iframe>\n\n<!-- VideoDropTracker 트래킹 -->\n${snippetOnly}`
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="px-8 py-4">
          <h2 className="text-[16px] font-semibold text-foreground">영상 관리</h2>
        </div>
      </header>

      <main className="px-8 py-8">
        <div className="max-w-4xl space-y-8">

          {/* ===== 영상 등록 ===== */}
          <Card className="bg-white border-border/60 shadow-none">
            <CardContent className="pt-5 pb-5 px-6">
              <h3 className="text-[14px] font-semibold text-foreground mb-1">영상 등록</h3>
              <p className="text-[12px] text-muted-foreground mb-4">
                트래킹할 YouTube 영상 URL을 입력하세요. 영상 제목과 썸네일을 자동으로 가져옵니다.
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError('') }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => e.key === 'Enter' && registerVideo()}
                />
                <Button onClick={registerVideo} disabled={!videoId || registering} className="h-10 px-5 text-[13px]">
                  {registering ? '등록 중...' : '등록'}
                </Button>
              </div>

              {url && !videoId && <p className="text-[12px] text-destructive mt-2">유효한 YouTube URL이 아닙니다</p>}
              {error && <p className="text-[12px] text-destructive mt-2">{error}</p>}

              {videoId && !error && (
                <div className="mt-4 flex gap-4 items-center p-3 bg-muted/50 rounded-lg">
                  <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" className="w-28 rounded bg-muted" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Video ID</p>
                    <p className="text-[13px] font-mono font-medium text-foreground">{videoId}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== 등록된 영상 목록 ===== */}
          <div>
            <h3 className="text-[15px] font-semibold text-foreground mb-4">
              등록된 영상
              {videos.length > 0 && <span className="text-muted-foreground font-normal ml-2 text-[13px]">{videos.length}개</span>}
            </h3>

            {loading ? (
              <p className="text-[13px] text-muted-foreground py-8 text-center">불러오는 중...</p>
            ) : videos.length === 0 ? (
              <Card className="bg-white border-border/60 shadow-none">
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <p className="text-[13px] text-muted-foreground">등록된 영상이 없습니다</p>
                  <p className="text-[12px] text-muted-foreground mt-1">위에서 YouTube URL을 입력해 영상을 등록하세요</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {videos.map((v) => (
                  <Card key={v.video_id} className="bg-white border-border/60 shadow-none hover:shadow-sm transition-shadow">
                    <CardContent className="pt-4 pb-4 px-5">
                      <div className="flex gap-4">
                        {/* 썸네일 */}
                        <Link href={`/dashboard?videoId=${v.video_id}`} className="shrink-0">
                          <div className="relative">
                            <img src={v.thumbnail_url} alt={v.title} className="w-40 h-[90px] rounded-md object-cover bg-muted" />
                            {v.session_count > 0 && (
                              <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                {v.session_count}회
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/dashboard?videoId=${v.video_id}`}>
                            <h4 className="text-[14px] font-semibold text-foreground leading-snug line-clamp-2 hover:underline">
                              {v.title}
                            </h4>
                          </Link>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{v.channel_name}</p>

                          <div className="flex items-center gap-2 mt-2.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-[11px] text-muted-foreground">
                              {v.session_count > 0 ? `${v.session_count}회 시청` : '데이터 없음'}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">{v.video_id}</span>
                          </div>
                        </div>

                        {/* 액션 */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] px-2.5"
                            onClick={() => setExpandedCode(expandedCode === v.video_id ? null : v.video_id)}
                          >
                            {expandedCode === v.video_id ? '코드 닫기' : '트래킹 코드'}
                          </Button>
                          {v.session_count > 0 && (
                            <Link href={`/dashboard?videoId=${v.video_id}`}>
                              <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5 w-full">
                                대시보드
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] px-2.5 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteVideo(v.video_id)}
                          >
                            삭제
                          </Button>
                        </div>
                      </div>

                      {/* 확장: 트래킹 코드 */}
                      {expandedCode === v.video_id && (
                        <div className="mt-4 pt-4 border-t border-border/60">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[12px] font-medium text-foreground">LP에 붙여넣을 코드</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[11px] px-2.5"
                              onClick={() => copyToClipboard(getFullCode(v.video_id), v.video_id)}
                            >
                              {copied === v.video_id ? '복사됨!' : '전체 복사'}
                            </Button>
                          </div>
                          <pre className="bg-[#1a1a1a] text-[#e0e0e0] rounded-lg p-4 text-[11px] leading-relaxed overflow-x-auto font-mono whitespace-pre">
{getFullCode(v.video_id)}
                          </pre>
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <ol className="text-[11px] text-muted-foreground space-y-0.5 list-decimal list-inside">
                              <li>위 코드를 LP(랜딩페이지)의 원하는 위치에 붙여넣기</li>
                              <li>배포하면 시청 데이터가 자동 수집됩니다</li>
                              <li>대시보드에서 실시간 확인 가능</li>
                            </ol>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ===== 기존 LP용 스니펫 ===== */}
          <Card className="bg-white border-border/60 shadow-none">
            <CardContent className="pt-5 pb-5 px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">기존 LP에 트래킹만 추가</h3>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    이미 YouTube iframe이 있는 LP라면 아래 스니펫만 추가하세요.
                  </p>
                </div>
                <Button
                  variant="outline" size="sm" className="h-8 text-[12px] shrink-0"
                  onClick={() => copyToClipboard(snippetOnly, 'snippet-only')}
                >
                  {copied === 'snippet-only' ? '복사됨!' : '복사'}
                </Button>
              </div>
              <pre className="mt-3 bg-[#1a1a1a] text-[#e0e0e0] rounded-lg p-4 text-[12px] leading-relaxed overflow-x-auto font-mono whitespace-pre">
{snippetOnly}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
