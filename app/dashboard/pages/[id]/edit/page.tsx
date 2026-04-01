'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

// ── Section 타입 정의 ──
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

type SectionType = 'video' | 'text' | 'button' | 'spacer'

interface Section {
  id: string
  type: SectionType
  content: VideoContent | TextContent | ButtonContent | SpacerContent
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
  folder: string
  sections: Section[]
  published: boolean
  bg_color: string
  max_width: number
  header?: HeaderFooter
  footer?: HeaderFooter
}

function genId() {
  return crypto.randomUUID()
}

const defaultHeader: HeaderFooter = {
  enabled: false,
  text: '사이트 이름',
  fontSize: 16,
  fontFamily: 'pretendard',
  bgColor: '#ffffff',
  textColor: '#000000',
  align: 'left',
  links: [],
}

const defaultFooter: HeaderFooter = {
  enabled: false,
  text: '© 2026 All rights reserved.',
  fontSize: 13,
  fontFamily: 'pretendard',
  bgColor: '#f5f5f5',
  textColor: '#666666',
  align: 'center',
  links: [],
}

const SECTION_TYPE_LABEL: Record<SectionType, string> = {
  video: '영상',
  text: '텍스트',
  button: 'CTA 버튼',
  spacer: '여백',
}

function defaultSection(type: SectionType): Section {
  switch (type) {
    case 'video':
      return { id: genId(), type: 'video', content: { videoId: '', aspectRatio: '16:9' } }
    case 'text':
      return {
        id: genId(),
        type: 'text',
        content: { text: '텍스트를 입력하세요', fontSize: 18, fontWeight: 'normal', fontFamily: 'pretendard' as const, align: 'center', color: '#000000' },
      }
    case 'button':
      return {
        id: genId(),
        type: 'button',
        content: { text: '버튼 텍스트', url: '', bgColor: '#000000', textColor: '#ffffff', fontSize: 16, borderRadius: 8, fullWidth: false },
      }
    case 'spacer':
      return { id: genId(), type: 'spacer', content: { height: 40 } }
  }
}

// ── 메인 에디터 ──
export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.id as string

  const [page, setPage] = useState<LandingPage | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  // 'header' | 'footer' | null - 오른쪽 패널에서 편집
  const [editingHF, setEditingHF] = useState<'header' | 'footer' | null>(null)

  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/pages/${pageId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.page) {
          // 기존 데이터에 header/footer 없으면 기본값
          const p = d.page as LandingPage
          if (!p.header) p.header = { ...defaultHeader }
          if (!p.footer) p.footer = { ...defaultFooter }
          setPage(p)
        } else {
          router.push('/dashboard/pages')
        }
      })
  }, [pageId, router])

  const save = useCallback(
    async (data?: Partial<LandingPage>) => {
      if (!page) return
      setSaving(true)
      setSaved(false)
      const body = data || {
        title: page.title,
        slug: page.slug,
        folder: page.folder,
        sections: page.sections,
        published: true,
        bg_color: page.bg_color,
        max_width: page.max_width,
        header: page.header,
        footer: page.footer,
      }
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (result.page) {
        const p = result.page as LandingPage
        if (!p.header) p.header = { ...defaultHeader }
        if (!p.footer) p.footer = { ...defaultFooter }
        setPage(p)
      }
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    [page, pageId]
  )

  function updatePage(updates: Partial<LandingPage>) {
    if (!page) return
    setPage({ ...page, ...updates })
  }

  function addSection(type: SectionType, index?: number) {
    if (!page) return
    const section = defaultSection(type)
    const sections = [...page.sections]
    if (index !== undefined) {
      sections.splice(index, 0, section)
    } else {
      sections.push(section)
    }
    setPage({ ...page, sections })
    setEditingSection(section.id)
    setEditingHF(null)
  }

  function updateSection(id: string, content: Section['content']) {
    if (!page) return
    setPage({
      ...page,
      sections: page.sections.map((s) => (s.id === id ? { ...s, content } : s)),
    })
  }

  function deleteSection(id: string) {
    if (!page) return
    setPage({ ...page, sections: page.sections.filter((s) => s.id !== id) })
    if (editingSection === id) setEditingSection(null)
  }

  function duplicateSection(id: string) {
    if (!page) return
    const idx = page.sections.findIndex((s) => s.id === id)
    if (idx < 0) return
    const clone = { ...page.sections[idx], id: genId(), content: { ...page.sections[idx].content } }
    const sections = [...page.sections]
    sections.splice(idx + 1, 0, clone)
    setPage({ ...page, sections })
  }

  function handleDragStart(index: number) { dragItem.current = index }
  function handleDragOver(e: React.DragEvent, index: number) { e.preventDefault(); dragOverItem.current = index; setDragOverIndex(index) }
  function handleDragEnd() {
    if (!page || dragItem.current === null || dragOverItem.current === null) { setDragOverIndex(null); return }
    const sections = [...page.sections]
    const [removed] = sections.splice(dragItem.current, 1)
    sections.splice(dragOverItem.current, 0, removed)
    setPage({ ...page, sections })
    dragItem.current = null; dragOverItem.current = null; setDragOverIndex(null)
  }

  const selectedSection = page?.sections.find((s) => s.id === editingSection) || null
  const header = page?.header || defaultHeader
  const footer = page?.footer || defaultFooter

  if (!page) {
    return <div className="flex items-center justify-center h-screen"><p className="text-muted-foreground">로딩 중...</p></div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── 왼쪽: 섹션 추가 패널 ── */}
      <div className="w-[180px] border-r bg-white p-4 flex flex-col gap-3 shrink-0 overflow-auto">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">섹션 추가</h3>
        {([
          { type: 'video' as const, label: '영상', icon: '▶' },
          { type: 'text' as const, label: '텍스트', icon: 'T' },
          { type: 'button' as const, label: 'CTA 버튼', icon: '◼' },
          { type: 'spacer' as const, label: '여백', icon: '⬜' },
        ]).map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => addSection(type)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            <span className="w-5 text-center text-xs">{icon}</span>
            {label}
          </button>
        ))}

        <div className="border-t my-1" />

        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">헤더 / 풋터</h3>
        <button
          onClick={() => { setEditingHF('header'); setEditingSection(null) }}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
            header.enabled ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-dashed border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground'
          }`}
        >
          <span className="w-5 text-center text-xs">▬</span>
          헤더 {header.enabled ? '(ON)' : ''}
        </button>
        <button
          onClick={() => { setEditingHF('footer'); setEditingSection(null) }}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
            footer.enabled ? 'border-blue-400 text-blue-600 bg-blue-50' : 'border-dashed border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground'
          }`}
        >
          <span className="w-5 text-center text-xs">▬</span>
          풋터 {footer.enabled ? '(ON)' : ''}
        </button>

        <div className="border-t my-1" />

        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">페이지 설정</h3>
        <div>
          <label className="text-[11px] text-muted-foreground">배경색</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={page.bg_color} onChange={(e) => updatePage({ bg_color: e.target.value })} className="w-7 h-7 rounded border cursor-pointer" />
            <input type="text" value={page.bg_color} onChange={(e) => updatePage({ bg_color: e.target.value })} className="flex-1 px-2 py-1 text-[11px] border rounded" />
          </div>
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">최대 너비 (px)</label>
          <input type="number" value={page.max_width} onChange={(e) => updatePage({ max_width: Number(e.target.value) })} className="w-full px-2 py-1 text-[11px] border rounded mt-1" min={320} max={1200} step={10} />
        </div>
      </div>

      {/* ── 중앙: 캔버스 ── */}
      <div className="flex-1 overflow-auto bg-[#f0f0f0] p-6">
        {/* 상단 바 */}
        <div className="max-w-2xl mx-auto mb-4 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/pages')} className="text-sm text-muted-foreground hover:text-foreground">← 목록</button>
          <input type="text" value={page.title} onChange={(e) => updatePage({ title: e.target.value })} className="flex-1 bg-transparent text-lg font-bold focus:outline-none border-b border-transparent focus:border-foreground" placeholder="페이지 제목" />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => save()} disabled={saving}>{saving ? '저장 중...' : saved ? '저장됨!' : '저장'}</Button>
            <Button size="sm" variant="outline" onClick={() => { const url = `${window.location.origin}/p/${page.slug}`; navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>{copied ? 'URL 복사됨!' : 'URL 공유'}</Button>
            <Button size="sm" variant="outline" onClick={() => window.open(`/p/${page.slug}`, '_blank')}>미리보기</Button>
          </div>
        </div>

        {/* 슬러그/폴더 */}
        <div className="max-w-2xl mx-auto mb-5 flex items-center gap-3 text-xs">
          <label className="text-muted-foreground">슬러그:</label>
          <input type="text" value={page.slug} onChange={(e) => updatePage({ slug: e.target.value.replace(/[^a-z0-9-]/g, '') })} className="px-2 py-1 border rounded w-48 focus:outline-none focus:ring-1 focus:ring-foreground" />
          <label className="text-muted-foreground">폴더:</label>
          <input type="text" value={page.folder} onChange={(e) => updatePage({ folder: e.target.value })} className="px-2 py-1 border rounded w-32 focus:outline-none focus:ring-1 focus:ring-foreground" />
        </div>

        {/* 캔버스 */}
        <div className="mx-auto rounded-xl shadow-lg overflow-hidden" style={{ maxWidth: page.max_width }}>
          {/* 헤더 프리뷰 */}
          {header.enabled && (
            <div
              onClick={() => { setEditingHF('header'); setEditingSection(null) }}
              className={`cursor-pointer transition-all ${editingHF === 'header' ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-muted-foreground/30'}`}
              style={{ backgroundColor: header.bgColor, color: header.textColor, fontFamily: FONT_MAP[header.fontFamily || 'pretendard'] }}
            >
              <div className="px-6 py-4 flex items-center justify-between">
                <span style={{ fontSize: header.fontSize, fontWeight: 'bold' }}>{header.text}</span>
                {header.links.length > 0 && (
                  <div className="flex items-center gap-4">
                    {header.links.map((link, i) => (
                      <span key={i} className="opacity-80 hover:opacity-100 transition-opacity" style={{ fontSize: header.fontSize - 2 }}>{link.text}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 본문 */}
          <div className="min-h-[200px] p-6" style={{ backgroundColor: page.bg_color }}>
            {page.sections.length === 0 && !header.enabled && !footer.enabled && (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-sm mb-1">왼쪽에서 섹션을 추가하세요</p>
                <p className="text-xs">섹션 클릭 → 오른쪽에서 설정</p>
              </div>
            )}

            {page.sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => { setEditingSection(section.id); setEditingHF(null) }}
                className={`group relative mb-2 rounded-lg cursor-pointer transition-all ${
                  dragOverIndex === index ? 'border-t-2 border-blue-500 pt-2' : ''
                } ${editingSection === section.id ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-muted-foreground/30'}`}
              >
                <div className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 bg-white rounded-lg shadow-sm border px-1 py-0.5 z-10">
                  <button onClick={(e) => { e.stopPropagation(); duplicateSection(section.id) }} className="p-1 text-xs text-muted-foreground hover:text-foreground" title="복제">⊕</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id) }} className="p-1 text-xs text-muted-foreground hover:text-red-600" title="삭제">✕</button>
                  <span className="cursor-grab px-1 text-xs text-muted-foreground" title="드래그로 이동">⋮⋮</span>
                </div>
                <SectionRenderer section={section} />
                <div className="flex justify-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {(['video', 'text', 'button', 'spacer'] as const).map((t) => (
                      <button key={t} onClick={(e) => { e.stopPropagation(); addSection(t, index + 1) }} className="px-2 py-0.5 text-[10px] bg-muted rounded text-muted-foreground hover:bg-foreground hover:text-background transition-colors">
                        +{t === 'video' ? '영상' : t === 'text' ? '텍스트' : t === 'button' ? '버튼' : '여백'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 풋터 프리뷰 */}
          {footer.enabled && (
            <div
              onClick={() => { setEditingHF('footer'); setEditingSection(null) }}
              className={`cursor-pointer transition-all ${editingHF === 'footer' ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-muted-foreground/30'}`}
              style={{ backgroundColor: footer.bgColor, color: footer.textColor, fontFamily: FONT_MAP[footer.fontFamily || 'pretendard'] }}
            >
              <div className="px-6 py-4" style={{ textAlign: footer.align }}>
                {footer.links.length > 0 && (
                  <div className="flex items-center gap-4 mb-2" style={{ justifyContent: footer.align === 'center' ? 'center' : footer.align === 'right' ? 'flex-end' : 'flex-start' }}>
                    {footer.links.map((link, i) => (
                      <span key={i} className="opacity-80" style={{ fontSize: footer.fontSize }}>{link.text}</span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: footer.fontSize }}>{footer.text}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 오른쪽: 설정 패널 ── */}
      <div className="w-[280px] border-l bg-white shrink-0 overflow-auto">
        {editingHF ? (
          <HeaderFooterEditor
            type={editingHF}
            data={editingHF === 'header' ? header : footer}
            onUpdate={(d) => updatePage({ [editingHF]: d })}
            onClose={() => setEditingHF(null)}
          />
        ) : selectedSection ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">{SECTION_TYPE_LABEL[selectedSection.type]} 설정</h3>
              <button onClick={() => setEditingSection(null)} className="text-xs text-muted-foreground hover:text-foreground">닫기</button>
            </div>
            <SectionEditor section={selectedSection} onUpdate={(content) => updateSection(selectedSection.id, content)} />
            <div className="border-t mt-4 pt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => duplicateSection(selectedSection.id)}>복제</Button>
              <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteSection(selectedSection.id)}>삭제</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
            <p className="text-sm text-center">섹션을 클릭하면<br />여기에서 설정할 수 있어요</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 헤더/풋터 에디터 ──
function HeaderFooterEditor({
  type,
  data,
  onUpdate,
  onClose,
}: {
  type: 'header' | 'footer'
  data: HeaderFooter
  onUpdate: (d: HeaderFooter) => void
  onClose: () => void
}) {
  function updateLink(index: number, field: 'text' | 'url', value: string) {
    const links = [...data.links]
    links[index] = { ...links[index], [field]: value }
    onUpdate({ ...data, links })
  }
  function addLink() {
    onUpdate({ ...data, links: [...data.links, { text: '링크', url: '' }] })
  }
  function removeLink(index: number) {
    onUpdate({ ...data, links: data.links.filter((_, i) => i !== index) })
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{type === 'header' ? '헤더' : '풋터'} 설정</h3>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">닫기</button>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={data.enabled}
            onChange={(e) => onUpdate({ ...data, enabled: e.target.checked })}
            className="rounded"
          />
          {type === 'header' ? '헤더' : '풋터'} 사용
        </label>

        {data.enabled && (
          <>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">{type === 'header' ? '로고/사이트명' : '하단 텍스트'}</label>
              <input
                type="text"
                value={data.text}
                onChange={(e) => onUpdate({ ...data, text: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">폰트</label>
              <select
                value={data.fontFamily || 'pretendard'}
                onChange={(e) => onUpdate({ ...data, fontFamily: e.target.value as 'pretendard' | 'noto-serif' })}
                className="w-full px-3 py-2 text-sm border rounded-lg"
              >
                <option value="pretendard">고딕 (Pretendard)</option>
                <option value="noto-serif">명조 (Noto Serif)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">글자 크기 (px)</label>
              <input type="number" value={data.fontSize} onChange={(e) => onUpdate({ ...data, fontSize: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-lg" min={10} max={40} />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">정렬</label>
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map((a) => (
                  <button key={a} onClick={() => onUpdate({ ...data, align: a })} className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${data.align === a ? 'bg-foreground text-background border-foreground' : 'hover:border-foreground'}`}>
                    {a === 'left' ? '좌측' : a === 'center' ? '중앙' : '우측'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">배경색</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={data.bgColor} onChange={(e) => onUpdate({ ...data, bgColor: e.target.value })} className="w-10 h-10 rounded-lg border cursor-pointer" />
                  <input type="text" value={data.bgColor} onChange={(e) => onUpdate({ ...data, bgColor: e.target.value })} className="flex-1 px-2 py-2 text-xs border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">글자색</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={data.textColor} onChange={(e) => onUpdate({ ...data, textColor: e.target.value })} className="w-10 h-10 rounded-lg border cursor-pointer" />
                  <input type="text" value={data.textColor} onChange={(e) => onUpdate({ ...data, textColor: e.target.value })} className="flex-1 px-2 py-2 text-xs border rounded-lg" />
                </div>
              </div>
            </div>

            {/* 링크 관리 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">네비게이션 링크</label>
                <button onClick={addLink} className="text-xs text-blue-600 hover:text-blue-800">+ 추가</button>
              </div>
              {data.links.length === 0 && (
                <p className="text-xs text-muted-foreground">링크 없음</p>
              )}
              {data.links.map((link, i) => (
                <div key={i} className="flex items-center gap-1 mb-2">
                  <input
                    type="text"
                    value={link.text}
                    onChange={(e) => updateLink(i, 'text', e.target.value)}
                    placeholder="텍스트"
                    className="flex-1 px-2 py-1.5 text-xs border rounded"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={(e) => updateLink(i, 'url', e.target.value)}
                    placeholder="URL"
                    className="flex-1 px-2 py-1.5 text-xs border rounded"
                  />
                  <button onClick={() => removeLink(i)} className="text-xs text-red-500 hover:text-red-700 px-1">✕</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── 섹션 렌더러 ──
function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case 'video': {
      const c = section.content as VideoContent
      if (!c.videoId) {
        return <div className="bg-muted rounded-lg flex items-center justify-center aspect-video text-muted-foreground text-sm">YouTube 영상 ID를 입력하세요</div>
      }
      const aspectClass = c.aspectRatio === '4:3' ? 'aspect-[4/3]' : c.aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video'
      return (
        <div className={`relative ${aspectClass} rounded-lg overflow-hidden bg-black`}>
          <iframe src={`https://www.youtube.com/embed/${c.videoId}?enablejsapi=1`} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      )
    }
    case 'text': {
      const c = section.content as TextContent
      return <div className="py-2 px-1" style={{ fontSize: c.fontSize, fontWeight: c.fontWeight, fontFamily: FONT_MAP[c.fontFamily || 'pretendard'], textAlign: c.align, color: c.color }}>{c.text}</div>
    }
    case 'button': {
      const c = section.content as ButtonContent
      return (
        <div className="py-2 text-center">
          <span className={`inline-block px-8 py-3 font-medium ${c.fullWidth ? 'w-full' : ''}`} style={{ backgroundColor: c.bgColor, color: c.textColor, fontSize: c.fontSize, borderRadius: c.borderRadius }}>{c.text}</span>
        </div>
      )
    }
    case 'spacer': {
      const c = section.content as SpacerContent
      return <div className="relative" style={{ height: c.height }}><div className="absolute inset-0 border border-dashed border-muted-foreground/20 rounded flex items-center justify-center text-[10px] text-muted-foreground">여백 {c.height}px</div></div>
    }
  }
}

// ── 섹션 에디터 ──
function SectionEditor({ section, onUpdate }: { section: Section; onUpdate: (content: Section['content']) => void }) {
  switch (section.type) {
    case 'video': {
      const c = section.content as VideoContent
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">YouTube 영상 ID 또는 URL</label>
            <input type="text" value={c.videoId} onChange={(e) => { let val = e.target.value.trim(); const match = val.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/); if (match) val = match[1]; onUpdate({ ...c, videoId: val }) }} placeholder="예: dQw4w9WgXcQ" className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">화면 비율</label>
            <div className="flex gap-2">
              {(['16:9', '4:3', '1:1'] as const).map((r) => (
                <button key={r} onClick={() => onUpdate({ ...c, aspectRatio: r })} className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${c.aspectRatio === r ? 'bg-foreground text-background border-foreground' : 'hover:border-foreground'}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      )
    }
    case 'text': {
      const c = section.content as TextContent
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">텍스트</label>
            <textarea value={c.text} onChange={(e) => onUpdate({ ...c, text: e.target.value })} rows={4} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">폰트</label>
            <select value={c.fontFamily || 'pretendard'} onChange={(e) => onUpdate({ ...c, fontFamily: e.target.value as 'pretendard' | 'noto-serif' })} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="pretendard">고딕 (Pretendard)</option>
              <option value="noto-serif">명조 (Noto Serif)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">크기 (px)</label>
              <input type="number" value={c.fontSize} onChange={(e) => onUpdate({ ...c, fontSize: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-lg" min={10} max={72} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">굵기</label>
              <select value={c.fontWeight} onChange={(e) => onUpdate({ ...c, fontWeight: e.target.value as 'normal' | 'bold' })} className="w-full px-3 py-2 text-sm border rounded-lg">
                <option value="normal">보통</option>
                <option value="bold">굵게</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">정렬</label>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button key={a} onClick={() => onUpdate({ ...c, align: a })} className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${c.align === a ? 'bg-foreground text-background border-foreground' : 'hover:border-foreground'}`}>{a === 'left' ? '좌측' : a === 'center' ? '중앙' : '우측'}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">글자 색상</label>
            <div className="flex items-center gap-2">
              <input type="color" value={c.color} onChange={(e) => onUpdate({ ...c, color: e.target.value })} className="w-10 h-10 rounded-lg border cursor-pointer" />
              <input type="text" value={c.color} onChange={(e) => onUpdate({ ...c, color: e.target.value })} className="flex-1 px-3 py-2 text-sm border rounded-lg" />
            </div>
          </div>
        </div>
      )
    }
    case 'button': {
      const c = section.content as ButtonContent
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">버튼 텍스트</label>
            <input type="text" value={c.text} onChange={(e) => onUpdate({ ...c, text: e.target.value })} className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">링크 URL</label>
            <input type="url" value={c.url} onChange={(e) => onUpdate({ ...c, url: e.target.value })} placeholder="https://" className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">배경색</label>
              <div className="flex items-center gap-2"><input type="color" value={c.bgColor} onChange={(e) => onUpdate({ ...c, bgColor: e.target.value })} className="w-10 h-10 rounded-lg border cursor-pointer" /><input type="text" value={c.bgColor} onChange={(e) => onUpdate({ ...c, bgColor: e.target.value })} className="flex-1 px-2 py-2 text-xs border rounded-lg" /></div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">글자색</label>
              <div className="flex items-center gap-2"><input type="color" value={c.textColor} onChange={(e) => onUpdate({ ...c, textColor: e.target.value })} className="w-10 h-10 rounded-lg border cursor-pointer" /><input type="text" value={c.textColor} onChange={(e) => onUpdate({ ...c, textColor: e.target.value })} className="flex-1 px-2 py-2 text-xs border rounded-lg" /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">글자 크기</label>
              <input type="number" value={c.fontSize} onChange={(e) => onUpdate({ ...c, fontSize: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-lg" min={12} max={32} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">모서리 둥글기</label>
              <input type="number" value={c.borderRadius} onChange={(e) => onUpdate({ ...c, borderRadius: Number(e.target.value) })} className="w-full px-3 py-2 text-sm border rounded-lg" min={0} max={50} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"><input type="checkbox" checked={c.fullWidth} onChange={(e) => onUpdate({ ...c, fullWidth: e.target.checked })} className="rounded" />전체 너비로 표시</label>
        </div>
      )
    }
    case 'spacer': {
      const c = section.content as SpacerContent
      return (
        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground block">높이 (px)</label>
          <input type="range" value={c.height} onChange={(e) => onUpdate({ ...c, height: Number(e.target.value) })} min={10} max={200} className="w-full" />
          <div className="text-center text-sm text-muted-foreground">{c.height}px</div>
        </div>
      )
    }
  }
}
