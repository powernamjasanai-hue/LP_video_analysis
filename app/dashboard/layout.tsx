import Sidebar from './components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar />
      <div className="pl-[220px]">
        {children}
      </div>
    </div>
  )
}
