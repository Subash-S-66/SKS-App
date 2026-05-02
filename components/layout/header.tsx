"use client"
import { Menu, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-800 bg-slate-950 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex sm:hidden">
        <Button variant="outline" size="icon" className="shrink-0 text-slate-400 border-slate-800 bg-slate-900">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-white" onClick={() => signOut()}>
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Log out</span>
        </Button>
      </div>
    </header>
  )
}
