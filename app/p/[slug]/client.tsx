'use client'

import Script from 'next/script'

interface VideoContent {
  videoId: string
  aspectRatio: '16:9' | '4:3' | '1:1'
}

interface TextContent {
  text: string
  fontSize: number
  fontWeight: 'normal' | 'bold'
  fontFamily: 'pretendard' | 'noto-serif'
  align: 'left' | 'center' | 'right'
  color: string
}

const FONT_MAP = {
  pretendard: '"Pretendard Variable", Pretendard, sans-serif',
  'noto-serif': '"Noto Serif KR", serif',
} as const

interface ButtonContent {
  text: string
  url: string
  bgColor: string
  textColor: string
  fontSize: number
  borderRadius: number
  fullWidth: boolean
}

interface SpacerContent {
  height: number
}

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

export default function PublicPageClient({ page }: { page: LandingPage }) {
  const apiUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/track`
    : '/api/track'

  return (
    <div className="min-h-screen" style={{ backgroundColor: page.bg_color }}>
      <div
        className="mx-auto px-4 sm:px-6 py-6 sm:py-10"
        style={{ maxWidth: page.max_width }}
      >
        {page.sections.map((section) => {
          switch (section.type) {
            case 'video': {
              const c = section.content as unknown as VideoContent
              if (!c.videoId) return null
              const aspectClass =
                c.aspectRatio === '4:3'
                  ? 'aspect-[4/3]'
                  : c.aspectRatio === '1:1'
                  ? 'aspect-square'
                  : 'aspect-video'
              return (
                <div
                  key={section.id}
                  className={`relative ${aspectClass} rounded-lg overflow-hidden bg-black mb-4 w-full`}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${c.videoId}?enablejsapi=1&rel=0`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )
            }
            case 'text': {
              const c = section.content as unknown as TextContent
              // 모바일에서 큰 폰트 자동 스케일
              const mobileFontSize = c.fontSize > 28 ? c.fontSize * 0.7 : c.fontSize
              return (
                <div
                  key={section.id}
                  className="py-2 whitespace-pre-wrap break-words"
                  style={{
                    fontSize: mobileFontSize,
                    fontWeight: c.fontWeight,
                    fontFamily: FONT_MAP[c.fontFamily || 'pretendard'],
                    textAlign: c.align,
                    color: c.color,
                  }}
                >
                  <style>{`@media (min-width: 640px) { [data-section-id="${section.id}"] { font-size: ${c.fontSize}px !important; } }`}</style>
                  <span data-section-id={section.id} style={{ fontSize: 'inherit' }}>
                    {c.text}
                  </span>
                </div>
              )
            }
            case 'button': {
              const c = section.content as unknown as ButtonContent
              return (
                <div key={section.id} className="py-2 text-center">
                  <a
                    href={c.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block px-6 sm:px-8 py-3 sm:py-4 font-medium transition-opacity hover:opacity-90 active:opacity-80 ${
                      c.fullWidth ? 'w-full block' : ''
                    }`}
                    style={{
                      backgroundColor: c.bgColor,
                      color: c.textColor,
                      fontSize: c.fontSize,
                      borderRadius: c.borderRadius,
                    }}
                  >
                    {c.text}
                  </a>
                </div>
              )
            }
            case 'spacer': {
              const c = section.content as unknown as SpacerContent
              return <div key={section.id} style={{ height: c.height }} />
            }
            default:
              return null
          }
        })}
      </div>

      {/* 영상 트래킹 스니펫 */}
      <Script src="/snippet.js" data-api={apiUrl} strategy="afterInteractive" />
    </div>
  )
}
