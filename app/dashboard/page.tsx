import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Separator } from '@/components/ui/separator'
import VideoSelector from './components/VideoSelector'
import DateFilter from './components/DateFilter'
import MetricCards from './components/MetricCards'
import DropOffChart from './components/DropOffChart'
import PageUrlTable from './components/PageUrlTable'

interface Props {
  searchParams: { videoId?: string; period?: string }
}

function getDateFilter(period: string): string | null {
  const now = new Date()
  if (period === '7d') {
    now.setDate(now.getDate() - 7)
    return now.toISOString()
  }
  if (period === '30d') {
    now.setDate(now.getDate() - 30)
    return now.toISOString()
  }
  return null
}

export default async function DashboardPage({ searchParams }: Props) {
  // 등록된 영상 + 프로젝트 정보
  const { data: registeredVideos } = await supabaseAdmin
    .from('videos')
    .select('video_id, title, thumbnail_url, project_id')
    .order('created_at', { ascending: false })

  const { data: projects } = await supabaseAdmin
    .from('projects')
    .select('id, name')

  const projectMap = new Map((projects || []).map((p) => [p.id, p.name]))

  // 등록된 영상만 표시 (프로젝트 이름 포함)
  const videoList = (registeredVideos || []).map((v) => ({
    video_id: v.video_id,
    title: v.title,
    project_name: v.project_id ? projectMap.get(v.project_id) || null : null,
  }))

  const selectedVideo = searchParams.videoId || videoList[0]?.video_id || ''
  const period = searchParams.period || '30d'
  const dateFrom = getDateFilter(period)

  let query = supabaseAdmin
    .from('view_sessions')
    .select('*')
    .eq('video_id', selectedVideo)

  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }

  const { data: sessions } = await query
  const rows = sessions || []

  // ---- Compute metrics ----
  const totalSessions = rows.length
  const viewerIds = new Set(rows.map((r) => r.viewer_id))
  const viewerCount = viewerIds.size

  const maxDuration = rows.reduce((max, r) => Math.max(max, r.duration_seconds || 0), 0)
  const avgWatchTime = totalSessions > 0
    ? Math.round(rows.reduce((sum, r) => sum + (r.total_watch_time || 0), 0) / totalSessions)
    : 0
  const avgWatchPercent = maxDuration > 0 ? (avgWatchTime / maxDuration) * 100 : 0

  const earlyDropCount = rows.filter((r) => {
    const completed = r.duration_seconds && r.drop_off_second >= r.duration_seconds
    return !completed && r.drop_off_second <= 10
  }).length
  const earlyDropRate = totalSessions > 0 ? (earlyDropCount / totalSessions) * 100 : 0

  // ---- Drop-off buckets ----
  const bucketSize = 10
  const maxBucket = Math.ceil(maxDuration / bucketSize) * bucketSize
  const bucketCounts: Record<string, number> = {}
  for (let i = 0; i < maxBucket; i += bucketSize) {
    bucketCounts[`${i}-${i + bucketSize}`] = 0
  }
  rows.forEach((r) => {
    if (r.duration_seconds && r.drop_off_second >= r.duration_seconds) return
    const bucketStart = Math.floor(r.drop_off_second / bucketSize) * bucketSize
    const key = `${bucketStart}-${bucketStart + bucketSize}`
    if (bucketCounts[key] !== undefined) {
      bucketCounts[key]++
    }
  })
  const bucketData = Object.entries(bucketCounts).map(([bucket, count]) => ({
    bucket,
    rate: totalSessions > 0 ? (count / totalSessions) * 100 : 0,
  }))

  // ---- Page URL stats ----
  const urlStats: Record<string, { viewers: Set<string>; totalWatch: number; count: number }> = {}
  rows.forEach((r) => {
    if (!urlStats[r.page_url]) {
      urlStats[r.page_url] = { viewers: new Set(), totalWatch: 0, count: 0 }
    }
    urlStats[r.page_url].viewers.add(r.viewer_id)
    urlStats[r.page_url].totalWatch += r.total_watch_time || 0
    urlStats[r.page_url].count++
  })
  const pageUrlData = Object.entries(urlStats).map(([url, s]) => ({
    page_url: url,
    viewer_count: s.viewers.size,
    avg_watch_time: s.count > 0 ? Math.round(s.totalWatch / s.count) : 0,
  }))

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="px-8 py-4 flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-foreground">대시보드</h2>
          {videoList.length > 0 && (
            <div className="flex items-center gap-3">
              <Suspense fallback={null}>
                <VideoSelector videos={videoList} />
              </Suspense>
              <Separator orientation="vertical" className="h-8" />
              <Suspense fallback={null}>
                <DateFilter />
              </Suspense>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-8 py-8">
        {videoList.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <p className="text-[15px] font-medium text-foreground">
                아직 수집된 데이터가 없습니다
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5 max-w-[280px]">
                트래킹 코드 탭에서 코드를 생성해 LP에 삽입해주세요
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session count */}
            <p className="text-[13px] text-muted-foreground">
              총 <span className="font-semibold text-foreground">{totalSessions.toLocaleString()}</span>개 세션
            </p>

            {/* Metric Cards */}
            <MetricCards
              viewerCount={viewerCount}
              avgWatchTime={avgWatchTime}
              avgWatchPercent={avgWatchPercent}
              earlyDropRate={earlyDropRate}
            />

            {/* Charts */}
            <div className="space-y-6">
              <DropOffChart data={bucketData} />
              <PageUrlTable data={pageUrlData} />
            </div>
          </div>
        )}
      </main>
    </>
  )
}
