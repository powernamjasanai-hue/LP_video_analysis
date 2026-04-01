'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface LandingPage {
  id: string
  title: string
  slug: string
  folder: string
  published: boolean
  created_at: string
  updated_at: string
}

export default function PagesListPage() {
  const router = useRouter()
  const [pages, setPages] = useState<LandingPage[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    const res = await fetch('/api/pages')
    const data = await res.json()
    const list: LandingPage[] = data.pages || []
    setPages(list)
    const uniqueFolders = Array.from(new Set(list.map((p) => p.folder)))
    if (!uniqueFolders.includes('기본')) uniqueFolders.unshift('기본')
    setFolders(uniqueFolders)
  }

  async function createPage() {
    setCreating(true)
    const folder = selectedFolder || '기본'
    const slug = `lp-${Date.now()}`
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '새 랜딩페이지', folder, slug }),
    })
    const data = await res.json()
    setCreating(false)
    if (data.page) {
      router.push(`/dashboard/pages/${data.page.id}/edit`)
    }
  }

  async function deletePage(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await fetch(`/api/pages/${id}`, { method: 'DELETE' })
    fetchPages()
  }

  function addFolder() {
    const name = newFolderName.trim()
    if (!name || folders.includes(name)) return
    setFolders([...folders, name])
    setSelectedFolder(name)
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const filteredPages = selectedFolder
    ? pages.filter((p) => p.folder === selectedFolder)
    : pages

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">랜딩페이지</h1>
          <p className="text-sm text-muted-foreground mt-1">
            VSL 마케팅용 랜딩페이지를 만들고 관리하세요
          </p>
        </div>
        <Button onClick={createPage} disabled={creating}>
          {creating ? '생성 중...' : '+ 새 페이지'}
        </Button>
      </div>

      {/* 폴더 탭 */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedFolder(null)}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            selectedFolder === null
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          전체 ({pages.length})
        </button>
        {folders.map((folder) => {
          const count = pages.filter((p) => p.folder === folder).length
          return (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedFolder === folder
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {folder} ({count})
            </button>
          )
        })}
        {showNewFolder ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="폴더명"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFolder()}
              className="px-2 py-1 text-sm border rounded-lg w-28 focus:outline-none focus:ring-1 focus:ring-foreground"
              autoFocus
            />
            <Button variant="ghost" size="sm" onClick={addFolder}>
              추가
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNewFolder(false)}
            >
              취소
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            + 폴더
          </button>
        )}
      </div>

      {/* 페이지 목록 */}
      {filteredPages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg mb-2">아직 페이지가 없습니다</p>
          <p className="text-sm">새 페이지를 만들어서 시작하세요</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredPages.map((page) => (
            <Card
              key={page.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/pages/${page.id}/edit`)}
            >
              <CardContent className="flex items-center justify-between py-4 px-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">
                      {page.title}
                    </h3>
                    <span
                      className={`shrink-0 px-2 py-0.5 text-[11px] rounded-full ${
                        page.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {page.published ? '공개' : '비공개'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>/{page.slug}</span>
                    <span>{page.folder}</span>
                    <span>
                      {new Date(page.updated_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {page.published && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          const url = `${window.location.origin}/p/${page.slug}`
                          navigator.clipboard.writeText(url)
                          alert('URL이 복사되었습니다!')
                        }}
                      >
                        URL 복사
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`/p/${page.slug}`, '_blank')
                        }}
                      >
                        보기
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePage(page.id)
                    }}
                    className="text-muted-foreground hover:text-red-600"
                  >
                    삭제
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
