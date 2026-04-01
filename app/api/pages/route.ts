import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: 랜딩페이지 목록
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('landing_pages')
    .select('id, title, slug, folder, published, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ pages: data || [] })
}

// POST: 랜딩페이지 생성
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const title = body.title || '새 랜딩페이지'
    const folder = body.folder || '기본'
    const slug = body.slug || `page-${Date.now()}`

    const { data, error } = await supabaseAdmin
      .from('landing_pages')
      .insert({ title, folder, slug, sections: [], published: false })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: '이미 사용 중인 슬러그입니다' }, { status: 409 })
      }
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ page: data })
  } catch {
    return Response.json({ error: 'invalid request' }, { status: 400 })
  }
}
