'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function extractVideoId(url: string): string | null {
  // youtube.com/watch?v=ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]
  // youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  // youtube.com/embed/ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]
  // raw 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  return null
}

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}

export default function TrackingPage() {
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState<'embed' | 'snippet' | null>(null)

  const videoId = url ? extractVideoId(url) : null
  const baseUrl = getBaseUrl()

  const embedCode = videoId
    ? `<iframe width="560" height="315"\n  src="https://www.youtube.com/embed/${videoId}"\n  frameborder="0"\n  allowfullscreen>\n</iframe>`
    : ''

  const snippetCode = baseUrl
    ? `<script src="${baseUrl}/snippet.js"\n  data-api="${baseUrl}/api/track"\n  async></script>`
    : ''

  const fullCode = videoId
    ? `<!-- YouTube 영상 -->\n${embedCode}\n\n<!-- VideoDropTracker 트래킹 -->\n${snippetCode}`
    : ''

  async function copyToClipboard(text: string, type: 'embed' | 'snippet') {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border">
        <div className="px-8 py-4">
          <h2 className="text-[16px] font-semibold text-foreground">트래킹 코드</h2>
        </div>
      </header>

      <main className="px-8 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* 설명 */}
          <div>
            <p className="text-[14px] text-foreground font-medium">
              YouTube 영상 URL을 입력하면 LP에 삽입할 트래킹 코드를 생성합니다.
            </p>
            <p className="text-[12px] text-muted-foreground mt-1">
              생성된 코드를 LP의 HTML에 붙여넣으면 시청 이탈 데이터가 자동 수집됩니다.
            </p>
          </div>

          {/* URL 입력 */}
          <Card className="bg-white border-border/60 shadow-none">
            <CardHeader className="pb-3 px-6 pt-5">
              <CardTitle className="text-[14px] font-semibold">
                1. YouTube 영상 URL 입력
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {url && !videoId && (
                <p className="text-[12px] text-destructive mt-2">
                  유효한 YouTube URL이 아닙니다
                </p>
              )}
              {videoId && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 bg-muted rounded text-[11px] font-mono text-foreground">
                    Video ID: {videoId}
                  </span>
                  <span className="text-[11px] text-muted-foreground">감지됨</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 영상 미리보기 */}
          {videoId && (
            <Card className="bg-white border-border/60 shadow-none">
              <CardHeader className="pb-3 px-6 pt-5">
                <CardTitle className="text-[14px] font-semibold">
                  2. 영상 미리보기
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-5">
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 생성된 코드 */}
          {videoId && (
            <Card className="bg-white border-border/60 shadow-none">
              <CardHeader className="pb-3 px-6 pt-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[14px] font-semibold">
                    3. LP에 붙여넣을 코드
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(fullCode, 'snippet')}
                    className="h-8 text-[12px]"
                  >
                    {copied === 'snippet' ? '복사됨!' : '전체 복사'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-5">
                <div className="relative">
                  <pre className="bg-[#1a1a1a] text-[#e0e0e0] rounded-lg p-4 text-[12px] leading-relaxed overflow-x-auto font-mono">
                    <code>
                      <span className="text-[#666]">{'<!-- YouTube 영상 -->'}</span>
                      {'\n'}
                      <span className="text-[#7cacf8]">{'<iframe'}</span>{' '}
                      <span className="text-[#c8a8ff]">width</span>=<span className="text-[#a8d8a8]">&quot;560&quot;</span>{' '}
                      <span className="text-[#c8a8ff]">height</span>=<span className="text-[#a8d8a8]">&quot;315&quot;</span>
                      {'\n  '}
                      <span className="text-[#c8a8ff]">src</span>=<span className="text-[#a8d8a8]">&quot;https://www.youtube.com/embed/{videoId}&quot;</span>
                      {'\n  '}
                      <span className="text-[#c8a8ff]">frameborder</span>=<span className="text-[#a8d8a8]">&quot;0&quot;</span>
                      {'\n  '}
                      <span className="text-[#c8a8ff]">allowfullscreen</span><span className="text-[#7cacf8]">{'>'}</span>
                      {'\n'}
                      <span className="text-[#7cacf8]">{'</iframe>'}</span>
                      {'\n\n'}
                      <span className="text-[#666]">{'<!-- VideoDropTracker 트래킹 -->'}</span>
                      {'\n'}
                      <span className="text-[#7cacf8]">{'<script'}</span>{' '}
                      <span className="text-[#c8a8ff]">src</span>=<span className="text-[#a8d8a8]">&quot;{baseUrl}/snippet.js&quot;</span>
                      {'\n  '}
                      <span className="text-[#c8a8ff]">data-api</span>=<span className="text-[#a8d8a8]">&quot;{baseUrl}/api/track&quot;</span>
                      {'\n  '}
                      <span className="text-[#c8a8ff]">async</span><span className="text-[#7cacf8]">{'>'}</span><span className="text-[#7cacf8]">{'</script>'}</span>
                    </code>
                  </pre>
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-[12px] font-medium text-foreground mb-1">사용 방법</p>
                  <ol className="text-[12px] text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>위 코드를 전체 복사합니다</li>
                    <li>LP(랜딩페이지)의 영상을 넣고 싶은 위치에 붙여넣습니다</li>
                    <li>페이지를 배포하면 시청 데이터가 자동으로 수집됩니다</li>
                    <li>대시보드 탭에서 수집된 데이터를 확인합니다</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 기존 LP에 트래킹만 추가 */}
          <Card className="bg-white border-border/60 shadow-none">
            <CardHeader className="pb-3 px-6 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[14px] font-semibold">
                    이미 YouTube iframe이 있는 LP라면?
                  </CardTitle>
                  <p className="text-[12px] text-muted-foreground mt-1">
                    아래 스니펫만 LP에 추가하세요. 기존 iframe을 자동 감지합니다.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(snippetCode, 'embed')}
                  className="h-8 text-[12px] shrink-0"
                >
                  {copied === 'embed' ? '복사됨!' : '복사'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              <pre className="bg-[#1a1a1a] text-[#e0e0e0] rounded-lg p-4 text-[12px] leading-relaxed overflow-x-auto font-mono">
                <code>
                  <span className="text-[#7cacf8]">{'<script'}</span>{' '}
                  <span className="text-[#c8a8ff]">src</span>=<span className="text-[#a8d8a8]">&quot;{baseUrl}/snippet.js&quot;</span>
                  {'\n  '}
                  <span className="text-[#c8a8ff]">data-api</span>=<span className="text-[#a8d8a8]">&quot;{baseUrl}/api/track&quot;</span>
                  {'\n  '}
                  <span className="text-[#c8a8ff]">async</span><span className="text-[#7cacf8]">{'>'}</span><span className="text-[#7cacf8]">{'</script>'}</span>
                </code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
