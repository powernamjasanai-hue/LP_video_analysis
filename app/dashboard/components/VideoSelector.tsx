'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function VideoSelector({ videoIds }: { videoIds: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('videoId') || videoIds[0] || ''

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('videoId', e.target.value)
    router.push(`/dashboard?${params.toString()}`)
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
    >
      {videoIds.map((id) => (
        <option key={id} value={id}>{id}</option>
      ))}
    </select>
  )
}
