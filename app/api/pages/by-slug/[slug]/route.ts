import { supabaseAdmin } from '@/lib/supabase-admin'

// GET: slug로 퍼블리시된 페이지 조회 (퍼블릭 뷰용)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const { data, error } = await supabaseAdmin
    .from('landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error || !data) {
    return Response.json({ error: '페이지를 찾을 수 없습니다' }, { status: 404 })
  }

  return Response.json({ page: data })
}
