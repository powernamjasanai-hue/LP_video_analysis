import { supabaseAdmin } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/
const URL_RE = /^https?:\/\/.+/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validate(data: any): string | null {
  if (typeof data.viewer_id !== 'string' || !UUID_RE.test(data.viewer_id)) {
    return 'invalid viewer_id'
  }
  if (typeof data.video_id !== 'string' || !YOUTUBE_ID_RE.test(data.video_id)) {
    return 'invalid video_id'
  }
  if (typeof data.page_url !== 'string' || !URL_RE.test(data.page_url)) {
    return 'invalid page_url'
  }
  if (data.duration_seconds != null) {
    const dur = Number(data.duration_seconds)
    if (!Number.isInteger(dur) || dur < 1 || dur > 36000) {
      return 'invalid duration_seconds'
    }
  }
  if (typeof data.total_watch_time !== 'number' || data.total_watch_time < 0) {
    return 'invalid total_watch_time'
  }
  if (typeof data.max_second_reached !== 'number' || data.max_second_reached < 0) {
    return 'invalid max_second_reached'
  }
  if (typeof data.drop_off_second !== 'number' || data.drop_off_second < 0) {
    return 'invalid drop_off_second'
  }
  return null
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(request: Request) {
  try {
    const text = await request.text()
    const data = JSON.parse(text)

    const error = validate(data)
    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: CORS_HEADERS,
      })
    }

    const { error: dbError } = await supabaseAdmin.from('view_sessions').insert({
      viewer_id: data.viewer_id,
      video_id: data.video_id,
      page_url: data.page_url,
      duration_seconds: data.duration_seconds ?? null,
      total_watch_time: Math.floor(data.total_watch_time),
      max_second_reached: Math.floor(data.max_second_reached),
      drop_off_second: Math.floor(data.drop_off_second),
    })

    if (dbError) {
      console.error('[VDT] DB insert error:', dbError)
      return new Response(JSON.stringify({ error: 'db error' }), {
        status: 500,
        headers: CORS_HEADERS,
      })
    }

    return new Response('ok', { headers: CORS_HEADERS })
  } catch (e) {
    console.error('[VDT] Parse error:', e)
    return new Response(JSON.stringify({ error: 'invalid payload' }), {
      status: 400,
      headers: CORS_HEADERS,
    })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}
