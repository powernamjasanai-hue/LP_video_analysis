'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description: string | null
  video_count: number
  created_at: string
}

interface Video {
  id: string
  video_id: string
  title: string
  thumbnail_url: string
  channel_name: string
  project_id: string | null
  session_count: number
}

function extractVideoId(url: string): string | null {
  const m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) || url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (m) return m[1]
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  return null
}

function getBaseUrl() {
  return typeof window !== 'undefined' ? window.location.origin : ''
}

export default function VideosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  // 프로젝트 생성
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)

  // 영상 등록
  const [videoUrl, setVideoUrl] = useState('')
  const [videoProjectId, setVideoProjectId] = useState<string>('')
  const [registering, setRegistering] = useState(false)
  const [videoError, setVideoError] = useState('')

  // UI
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const videoId = videoUrl ? extractVideoId(videoUrl) : null
  const baseUrl = getBaseUrl()
  const snippetOnly = `<script src="${baseUrl}/snippet.js"\n  data-api="${baseUrl}/api/track"\n  async></script>`

  const fetchAll = useCallback(async () => {
    const [pRes, vRes] = await Promise.all([fetch('/api/projects'), fetch('/api/videos')])
    const pData = await pRes.json()
    const vData = await vRes.json()
    setProjects(pData.projects || [])
    setVideos(vData.videos || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function createProject() {
    if (!newProjectName.trim()) return
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
    })
    setNewProjectName('')
    setNewProjectDesc('')
    setShowNewProject(false)
    fetchAll()
  }

  async function deleteProject(id: string) {
    if (!confirm('이 프로젝트를 삭제할까요? (영상은 미분류로 이동합니다)')) return
    await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchAll()
  }

  async function registerVideo() {
    if (!videoId) return
    setRegistering(true)
    setVideoError('')
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, project_id: videoProjectId || null }),
    })
    const data = await res.json()
    if (!res.ok) {
      setVideoError(data.error === 'already_registered' ? '이미 등록된 영상입니다' : (data.error || '등록 실패'))
    } else {
      setVideoUrl('')
      setVideoError('')
      fetchAll()
    }
    setRegistering(false)
  }

  async function moveVideoProject(videoId: string, projectId: string | null) {
    await fetch('/api/videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, project_id: projectId }),
    })
    fetchAll()
  }

  async function deleteVideo(vid: string) {
    if (!confirm('이 영상을 삭제할까요?')) return
    await fetch('/api/videos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: vid }),
    })
    fetchAll()
  }

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  function getFullCode(vid: string) {
    return `<!-- YouTube 영상 -->\n<iframe width="560" height="315"\n  src="https://www.youtube.com/embed/${vid}"\n  frameborder="0"\n  allowfullscreen>\n</iframe>\n\n<!-- VideoDropTracker -->\n${snippetOnly}`
  }

  function videosForProject(projectId: string | null) {
    return videos.filter((v) => v.project_id === projectId)
  }

  const unassignedVideos = videos.filter((v) => !v.project_id)

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="px-8 py-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">영상 관리</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => setShowNewProject(!showNewProject)}>
              + 프로젝트
            </Button>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <div className="max-w-4xl space-y-6">

          {/* ===== 프로젝트 생성 ===== */}
          {showNewProject && (
            <Card className="bg-white border-border/60 shadow-none">
              <CardContent className="pt-5 pb-5 px-6">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">새 프로젝트</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="프로젝트 이름 (예: 봄 프로모션 LP)"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => e.key === 'Enter' && createProject()}
                  />
                  <input
                    type="text"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="설명 (선택사항)"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                  <div className="flex gap-2">
                    <Button onClick={createProject} disabled={!newProjectName.trim()} className="h-9 text-[13px]">
                      생성
                    </Button>
                    <Button variant="ghost" onClick={() => setShowNewProject(false)} className="h-9 text-[13px]">
                      취소
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== 영상 등록 ===== */}
          <Card className="bg-white border-border/60 shadow-none">
            <CardContent className="pt-5 pb-5 px-6">
              <h3 className="text-[14px] font-semibold text-foreground mb-1">영상 등록</h3>
              <p className="text-[12px] text-muted-foreground mb-4">YouTube URL을 입력하고 프로젝트를 선택하세요.</p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); setVideoError('') }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => e.key === 'Enter' && registerVideo()}
                />
                <select
                  value={videoProjectId}
                  onChange={(e) => setVideoProjectId(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">미분류</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Button onClick={registerVideo} disabled={!videoId || registering} className="h-10 px-5 text-[13px]">
                  {registering ? '등록 중...' : '등록'}
                </Button>
              </div>

              {videoUrl && !videoId && <p className="text-[12px] text-destructive mt-2">유효한 YouTube URL이 아닙니다</p>}
              {videoError && <p className="text-[12px] text-destructive mt-2">{videoError}</p>}

              {videoId && !videoError && (
                <div className="mt-3 flex gap-3 items-center p-2.5 bg-muted/50 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" className="w-24 rounded bg-muted" />
                  <span className="text-[12px] font-mono text-muted-foreground">{videoId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== 프로젝트별 영상 목록 ===== */}
          {loading ? (
            <p className="text-[13px] text-muted-foreground py-8 text-center">불러오는 중...</p>
          ) : projects.length === 0 && videos.length === 0 ? (
            <Card className="bg-white border-border/60 shadow-none">
              <CardContent className="py-12 text-center">
                <p className="text-[13px] text-muted-foreground">등록된 영상이 없습니다</p>
                <p className="text-[12px] text-muted-foreground mt-1">위에서 프로젝트를 만들고 영상을 등록하세요</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {projects.map((project) => {
                const pVideos = videosForProject(project.id)
                const isExpanded = expandedProject === project.id || expandedProject === null

                return (
                  <div key={project.id}>
                    {/* 프로젝트 헤더 */}
                    <div
                      className="flex items-center justify-between mb-3 cursor-pointer group"
                      onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                          className={`text-muted-foreground transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <div>
                          <h3 className="text-[15px] font-semibold text-foreground">
                            {project.name}
                            <span className="text-muted-foreground font-normal ml-2 text-[12px]">{pVideos.length}개</span>
                          </h3>
                          {project.description && (
                            <p className="text-[11px] text-muted-foreground">{project.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 text-[11px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); deleteProject(project.id) }}
                      >
                        삭제
                      </Button>
                    </div>

                    {/* 영상 리스트 */}
                    {isExpanded && (
                      <div className="space-y-2 mb-6">
                        {pVideos.length === 0 ? (
                          <p className="text-[12px] text-muted-foreground pl-7 py-3">영상이 없습니다</p>
                        ) : (
                          pVideos.map((v) => (
                            <VideoCard
                              key={v.video_id}
                              video={v}
                              projects={projects}
                              expandedCode={expandedCode}
                              setExpandedCode={setExpandedCode}
                              copied={copied}
                              copyToClipboard={copyToClipboard}
                              getFullCode={getFullCode}
                              deleteVideo={deleteVideo}
                              onMoveProject={moveVideoProject}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* 미분류 영상 */}
              {unassignedVideos.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-semibold text-muted-foreground mb-3">
                    미분류
                    <span className="font-normal ml-2 text-[12px]">{unassignedVideos.length}개</span>
                  </h3>
                  <div className="space-y-2">
                    {unassignedVideos.map((v) => (
                      <VideoCard
                        key={v.video_id}
                        video={v}
                        projects={projects}
                        expandedCode={expandedCode}
                        setExpandedCode={setExpandedCode}
                        copied={copied}
                        copyToClipboard={copyToClipboard}
                        getFullCode={getFullCode}
                        deleteVideo={deleteVideo}
                        onMoveProject={moveVideoProject}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== 기존 LP용 스니펫 ===== */}
          <Card className="bg-white border-border/60 shadow-none">
            <CardContent className="pt-5 pb-5 px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">기존 LP에 트래킹만 추가</h3>
                  <p className="text-[12px] text-muted-foreground mt-1">이미 YouTube iframe이 있는 LP라면 아래 스니펫만 추가하세요.</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-[12px] shrink-0" onClick={() => copyToClipboard(snippetOnly, 'snippet-only')}>
                  {copied === 'snippet-only' ? '복사됨!' : '복사'}
                </Button>
              </div>
              <pre className="mt-3 bg-[#1a1a1a] text-[#e0e0e0] rounded-lg p-4 text-[12px] leading-relaxed overflow-x-auto font-mono whitespace-pre">{snippetOnly}</pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

// ===== 영상 카드 컴포넌트 =====
function VideoCard({
  video: v,
  projects,
  expandedCode,
  setExpandedCode,
  copied,
  copyToClipboard,
  getFullCode,
  deleteVideo,
  onMoveProject,
}: {
  video: Video
  projects: Project[]
  expandedCode: string | null
  setExpandedCode: (id: string | null) => void
  copied: string | null
  copyToClipboard: (text: string, id: string) => void
  getFullCode: (vid: string) => string
  deleteVideo: (vid: string) => void
  onMoveProject: (videoId: string, projectId: string | null) => void
}) {
  return (
    <Card className="bg-white border-border/60 shadow-none hover:shadow-sm transition-shadow">
      <CardContent className="pt-3.5 pb-3.5 px-5">
        <div className="flex gap-4">
          <Link href={`/dashboard?videoId=${v.video_id}`} className="shrink-0">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.thumbnail_url} alt={v.title} className="w-32 h-[72px] rounded object-cover bg-muted" />
              {v.session_count > 0 && (
                <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{v.session_count}회</span>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard?videoId=${v.video_id}`}>
              <h4 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-1 hover:underline">{v.title}</h4>
            </Link>
            <p className="text-[11px] text-muted-foreground mt-0.5">{v.channel_name}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] text-muted-foreground">{v.session_count > 0 ? `${v.session_count}회 시청` : '데이터 없음'}</span>
              <select
                value={v.project_id || ''}
                onChange={(e) => onMoveProject(v.video_id, e.target.value || null)}
                className="h-6 px-1.5 rounded border border-input bg-background text-[10px] text-muted-foreground focus:outline-none cursor-pointer"
              >
                <option value="">미분류</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-start gap-1 shrink-0">
            <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setExpandedCode(expandedCode === v.video_id ? null : v.video_id)}>
              {expandedCode === v.video_id ? '닫기' : '코드'}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 text-muted-foreground hover:text-destructive" onClick={() => deleteVideo(v.video_id)}>
              삭제
            </Button>
          </div>
        </div>

        {expandedCode === v.video_id && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-medium text-foreground">LP에 붙여넣을 코드</p>
              <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => copyToClipboard(getFullCode(v.video_id), v.video_id)}>
                {copied === v.video_id ? '복사됨!' : '복사'}
              </Button>
            </div>
            <pre className="bg-[#1a1a1a] text-[#e0e0e0] rounded-lg p-3 text-[11px] leading-relaxed overflow-x-auto font-mono whitespace-pre">{getFullCode(v.video_id)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
