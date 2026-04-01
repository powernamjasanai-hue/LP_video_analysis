import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
  return null // 'all'
}

export default async function DashboardPage({ searchParams }: Props) {
  // Get all distinct video IDs
  const { data: videoRows } = await supabaseAdmin
    .from('view_sessions')
    .select('video_id')

  const videoIds = Array.from(new Set((videoRows || []).map((r) => r.video_id)))
  const selectedVideo = searchParams.videoId || videoIds[0] || ''
  const period = searchParams.period || '30d'
  const dateFrom = getDateFilter(period)

  // Build query for selected video
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

  // 10-second early drop rate (exclude completed views)
  const earlyDropCount = rows.filter((r) => {
    const completed = r.duration_seconds && r.drop_off_second >= r.duration_seconds
    return !completed && r.drop_off_second <= 10
  }).length
  const earlyDropRate = totalSessions > 0 ? (earlyDropCount / totalSessions) * 100 : 0

  // ---- Drop-off buckets (10-second intervals) ----
  const bucketSize = 10
  const maxBucket = Math.ceil(maxDuration / bucketSize) * bucketSize
  const bucketCounts: Record<string, number> = {}
  for (let i = 0; i < maxBucket; i += bucketSize) {
    bucketCounts[`${i}-${i + bucketSize}`] = 0
  }
  rows.forEach((r) => {
    // Skip completed views
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">VideoDropTracker</h1>

        {videoIds.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">아직 수집된 데이터가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              LP에 트래킹 스니펫을 삽입하고 시청 데이터가 수집될 때까지 기다려주세요.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Suspense fallback={null}>
                <VideoSelector videoIds={videoIds} />
              </Suspense>
              <Suspense fallback={null}>
                <DateFilter />
              </Suspense>
              <span className="text-sm text-gray-400">
                총 {totalSessions}개 세션
              </span>
            </div>

            <div className="space-y-6">
              <MetricCards
                viewerCount={viewerCount}
                avgWatchTime={avgWatchTime}
                avgWatchPercent={avgWatchPercent}
                earlyDropRate={earlyDropRate}
              />
              <DropOffChart data={bucketData} />
              <PageUrlTable data={pageUrlData} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
