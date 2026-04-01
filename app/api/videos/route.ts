import { supabaseAdmin } from '@/lib/supabase-admin'

// YouTube oEmbed로 영상 정보 가져오기
async function fetchVideoInfo(videoId: string) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return {
      title: data.title as string,
      channel_name: data.author_name as string,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    }
  } catch {
    return null
  }
}

// GET: 등록된 영상 목록
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // 각 영상의 세션 수 집계
  const { data: sessionCounts } = await supabaseAdmin
    .from('view_sessions')
    .select('video_id')

  const countMap: Record<string, number> = {}
  ;(sessionCounts || []).forEach((r) => {
    countMap[r.video_id] = (countMap[r.video_id] || 0) + 1
  })

  const videos = (data || []).map((v) => ({
    ...v,
    session_count: countMap[v.video_id] || 0,
  }))

  return Response.json({ videos })
}

// POST: 영상 등록
export async function POST(request: Request) {
  try {
    const { video_id, project_id } = await request.json()

    if (!video_id || !/^[a-zA-Z0-9_-]{11}$/.test(video_id)) {
      return Response.json({ error: 'invalid video_id' }, { status: 400 })
    }

    // 이미 등록된 영상인지 확인
    const { data: existing } = await supabaseAdmin
      .from('videos')
      .select('id')
      .eq('video_id', video_id)
      .single()

    if (existing) {
      return Response.json({ error: 'already_registered' }, { status: 409 })
    }

    // YouTube에서 영상 정보 가져오기
    const info = await fetchVideoInfo(video_id)
    if (!info) {
      return Response.json({ error: 'YouTube 영상을 찾을 수 없습니다' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert({
        video_id,
        title: info.title,
        thumbnail_url: info.thumbnail_url,
        channel_name: info.channel_name,
        project_id: project_id || null,
      })
      .select()
      .single()

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ video: data })
  } catch {
    return Response.json({ error: 'invalid request' }, { status: 400 })
  }
}

// DELETE: 영상 삭제
export async function DELETE(request: Request) {
  try {
    const { video_id } = await request.json()

    const { error } = await supabaseAdmin
      .from('videos')
      .delete()
      .eq('video_id', video_id)

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'invalid request' }, { status: 400 })
  }
}
