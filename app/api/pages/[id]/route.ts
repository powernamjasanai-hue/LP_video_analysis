import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: 단일 페이지 조회
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('landing_pages')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return Response.json({ error: '페이지를 찾을 수 없습니다' }, { status: 404 })
  }

  return Response.json({ page: data })
}

// PUT: 페이지 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (body.title !== undefined) updates.title = body.title
    if (body.slug !== undefined) updates.slug = body.slug
    if (body.folder !== undefined) updates.folder = body.folder
    if (body.sections !== undefined) updates.sections = body.sections
    if (body.published !== undefined) updates.published = body.published
    if (body.bg_color !== undefined) updates.bg_color = body.bg_color
    if (body.max_width !== undefined) updates.max_width = body.max_width
    if (body.header !== undefined) updates.header = body.header
    if (body.footer !== undefined) updates.footer = body.footer

    const { data, error } = await supabaseAdmin
      .from('landing_pages')
      .update(updates)
      .eq('id', id)
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

// DELETE: 페이지 삭제
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabaseAdmin
    .from('landing_pages')
    .delete()
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
