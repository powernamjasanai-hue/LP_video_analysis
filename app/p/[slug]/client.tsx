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

interface HeaderFooter {
  enabled: boolean
  text: string
  fontSize: number
  fontFamily: 'pretendard' | 'noto-serif'
  bgColor: string
  textColor: string
  align: 'left' | 'center' | 'right'
  links: { text: string; url: string }[]
}

interface LandingPage {
  id: string
  title: string
  slug: string
  sections: Section[]
  bg_color: string
  max_width: number
  header?: HeaderFooter
  footer?: HeaderFooter
}

export default function PublicPageClient({ page }: { page: LandingPage }) {
  const apiUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/track`
    : '/api/track'

  const header = page.header
  const footer = page.footer

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: page.bg_color }}>
      {/* 헤더 */}
      {header?.enabled && (
        <header
          style={{
            backgroundColor: header.bgColor,
            color: header.textColor,
            fontFamily: FONT_MAP[header.fontFamily || 'pretendard'],
          }}
        >
          <div className="mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between" style={{ maxWidth: page.max_width }}>
            <span style={{ fontSize: header.fontSize, fontWeight: 'bold' }}>{header.text}</span>
            {header.links.length > 0 && (
              <nav className="flex items-center gap-3 sm:gap-5">
                {header.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                    style={{ fontSize: header.fontSize - 2 }}
                  >
                    {link.text}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </header>
      )}

      {/* 본문 */}
      <div className="flex-1">
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
                  <div key={section.id} className={`relative ${aspectClass} rounded-lg overflow-hidden bg-black mb-4 w-full`}>
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
                    <span data-section-id={section.id} style={{ fontSize: 'inherit' }}>{c.text}</span>
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
                      className={`inline-block px-6 sm:px-8 py-3 sm:py-4 font-medium transition-opacity hover:opacity-90 active:opacity-80 ${c.fullWidth ? 'w-full block' : ''}`}
                      style={{ backgroundColor: c.bgColor, color: c.textColor, fontSize: c.fontSize, borderRadius: c.borderRadius }}
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
      </div>

      {/* 풋터 */}
      {footer?.enabled && (
        <footer
          style={{
            backgroundColor: footer.bgColor,
            color: footer.textColor,
            fontFamily: FONT_MAP[footer.fontFamily || 'pretendard'],
          }}
        >
          <div
            className="mx-auto px-4 sm:px-6 py-4 sm:py-6"
            style={{ maxWidth: page.max_width, textAlign: footer.align }}
          >
            {footer.links.length > 0 && (
              <nav
                className="flex items-center gap-3 sm:gap-5 mb-3"
                style={{ justifyContent: footer.align === 'center' ? 'center' : footer.align === 'right' ? 'flex-end' : 'flex-start' }}
              >
                {footer.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-80 hover:opacity-100 transition-opacity"
                    style={{ fontSize: footer.fontSize }}
                  >
                    {link.text}
                  </a>
                ))}
              </nav>
            )}
            <p style={{ fontSize: footer.fontSize }}>{footer.text}</p>
          </div>
        </footer>
      )}

      <Script src="/snippet.js" data-api={apiUrl} strategy="afterInteractive" />
    </div>
  )
}
