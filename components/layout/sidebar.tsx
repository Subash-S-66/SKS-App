"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FolderKanban, Users, Settings, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSession } from "next-auth/react"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isAdmin = session?.user?.role === "admin"

  const adminLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/projects", icon: FolderKanban, label: "Projects" },
    { href: "/users", icon: Users, label: "Users" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ]

  const userLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/projects", icon: FolderKanban, label: "My Projects" },
    { href: "/settings", icon: UserCircle, label: "Profile" },
  ]

  const links = isAdmin ? adminLinks : userLinks

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 sm:flex">
      <div className="flex h-14 items-center border-b border-slate-800 px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center text-white">
            SKS
          </div>
          <span className="">Agency</span>
        </Link>
      </div>
      <div className="flex-1 py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname.startsWith(link.href) && link.href !== "/settings" || (pathname === "/settings" && link.href === "/settings")
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-blue-400",
                  isActive ? "bg-slate-800 text-blue-400" : "text-slate-400"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
