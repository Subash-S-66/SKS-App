import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-64">
          <Header />
          <main className="flex-1 items-start p-4 sm:px-6 sm:py-0 md:gap-8 text-white">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
