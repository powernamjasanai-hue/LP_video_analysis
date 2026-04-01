import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: 프로젝트 목록 + 각 프로젝트의 영상 수
export async function GET() {
  const { data: projects, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: videos } = await supabaseAdmin
    .from('videos')
    .select('project_id')

  const countMap: Record<string, number> = {}
  ;(videos || []).forEach((v) => {
    if (v.project_id) countMap[v.project_id] = (countMap[v.project_id] || 0) + 1
  })

  const result = (projects || []).map((p) => ({
    ...p,
    video_count: countMap[p.id] || 0,
  }))

  return Response.json({ projects: result })
}

// POST: 프로젝트 생성
export async function POST(request: Request) {
  const { name, description } = await request.json()

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return Response.json({ error: '프로젝트 이름을 입력해주세요' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ project: data })
}

// DELETE: 프로젝트 삭제 (영상은 project_id = null로)
export async function DELETE(request: Request) {
  const { id } = await request.json()

  const { error } = await supabaseAdmin
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}

// PATCH: 프로젝트 수정
export async function PATCH(request: Request) {
  const { id, name, description } = await request.json()

  const { error } = await supabaseAdmin
    .from('projects')
    .update({ name, description })
    .eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
