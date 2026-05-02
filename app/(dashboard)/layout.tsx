import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-950">
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex flex-1 flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full max-w-full overflow-hidden">
          <Header role={session.user.role} />
          <main className="flex-1 items-start p-3 sm:p-6 lg:p-8 sm:py-0 w-full max-w-full overflow-x-hidden text-white">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
