import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PageUrlRow {
  page_url: string
  viewer_count: number
  avg_watch_time: number
}

export default function PageUrlTable({ data }: { data: PageUrlRow[] }) {
  if (data.length === 0) {
    return (
      <Card className="bg-white border-border/60 shadow-none">
        <CardContent className="py-12 text-center">
          <p className="text-[13px] text-muted-foreground">데이터가 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-border/60 shadow-none hover:shadow-sm transition-shadow">
      <CardHeader className="pb-0 px-6 pt-5">
        <CardTitle className="text-[14px] font-semibold text-foreground">
          페이지별 시청 현황
        </CardTitle>
        <p className="text-[12px] text-muted-foreground">
          영상이 임베드된 페이지 URL별 통계
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-2 pt-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider h-9">
                페이지 URL
              </TableHead>
              <TableHead className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider text-right h-9 w-[100px]">
                시청자
              </TableHead>
              <TableHead className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider text-right h-9 w-[120px]">
                평균 시청
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.page_url} className="border-border/40">
                <TableCell className="text-[13px] text-foreground py-3 max-w-[400px]">
                  <span className="truncate block" title={row.page_url}>
                    {row.page_url}
                  </span>
                </TableCell>
                <TableCell className="text-[13px] text-foreground text-right py-3 tabular-nums">
                  {row.viewer_count.toLocaleString()}명
                </TableCell>
                <TableCell className="text-[13px] text-foreground text-right py-3 tabular-nums">
                  {row.avg_watch_time}초
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
