"use client"
import { Menu, LogOut, LayoutDashboard, FolderKanban, Users, Settings, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function Header({ role = "developer" }: { role?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isAdmin = role === "admin"

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
    <header className="sticky top-0 z-30 flex h-14 min-h-[56px] items-center gap-4 border-b border-slate-800 bg-slate-950 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex sm:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger>
            <Button variant="outline" size="icon" className="shrink-0 min-h-[44px] min-w-[44px] text-slate-400 border-slate-800 bg-slate-900">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-slate-950 border-r border-slate-800 p-0 text-white flex flex-col">
             <div className="sr-only">
               <SheetTitle>Navigation Menu</SheetTitle>
               <SheetDescription>Access the main sections of the SKS Agency dashboard.</SheetDescription>
             </div>

             <div className="flex h-14 items-center border-b border-slate-800 px-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white" onClick={() => setOpen(false)}>
                <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center text-white">
                  SKS
                </div>
                <span>Agency</span>
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              <div className="grid items-start px-2 text-sm font-medium">
                {links.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 transition-all hover:text-blue-400 min-h-[44px]",
                        isActive ? "bg-slate-800 text-blue-400" : "text-slate-400"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      <div className={`flex-1 flex sm:hidden ${isAdmin ? "justify-center mr-8" : "items-center"}`}>
         <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <div className="h-7 w-7 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs">
              SKS
            </div>
          </Link>
      </div>

      {/* Top Nav for non-admins on desktop */}
      {!isAdmin && (
        <div className="hidden sm:flex flex-1 items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white mr-4">
            <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center text-white">
              SKS
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            {userLinks.map(link => {
              const Icon = link.icon
              const isActive = pathname.startsWith(link.href) && link.href !== "/settings" || (pathname === "/settings" && link.href === "/settings")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 transition-colors hover:text-blue-400",
                    isActive ? "text-blue-400" : "text-slate-400"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}

      {/* Spacer for admin desktop */}
      {isAdmin && <div className="hidden sm:flex flex-1 items-center justify-end gap-4"></div>}

      <div className={`flex items-center gap-4 ${!isAdmin && "hidden sm:flex"}`}>
        <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-white min-h-[44px] min-w-[44px]" onClick={() => signOut()}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </header>
  )
}
