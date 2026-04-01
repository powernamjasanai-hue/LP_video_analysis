interface PageUrlRow {
  page_url: string
  viewer_count: number
  avg_watch_time: number
}

export default function PageUrlTable({ data }: { data: PageUrlRow[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm text-gray-500">데이터가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <h3 className="text-sm font-medium text-gray-700 px-6 pt-6 pb-3">페이지 URL별 시청 현황</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-gray-200 bg-gray-50">
            <th className="text-left px-6 py-3 font-medium text-gray-600">페이지 URL</th>
            <th className="text-right px-6 py-3 font-medium text-gray-600">시청자 수</th>
            <th className="text-right px-6 py-3 font-medium text-gray-600">평균 시청 시간</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.page_url} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-6 py-3 text-gray-800 truncate max-w-md" title={row.page_url}>
                {row.page_url}
              </td>
              <td className="px-6 py-3 text-right text-gray-700">{row.viewer_count}</td>
              <td className="px-6 py-3 text-right text-gray-700">{row.avg_watch_time}초</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
