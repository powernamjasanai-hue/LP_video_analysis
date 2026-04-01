import { supabaseAdmin } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import PublicPageClient from './client'

interface Section {
  id: string
  type: 'video' | 'text' | 'button' | 'spacer'
  content: Record<string, unknown>
}

interface LandingPage {
  id: string
  title: string
  slug: string
  sections: Section[]
  bg_color: string
  max_width: number
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data } = await supabaseAdmin
    .from('landing_pages')
    .select('title')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  return {
    title: data?.title || '페이지를 찾을 수 없습니다',
  }
}

export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data } = await supabaseAdmin
    .from('landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!data) notFound()

  const page = data as LandingPage

  return <PublicPageClient page={page} />
}
