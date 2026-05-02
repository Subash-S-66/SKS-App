"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Users, Settings, LogOut, Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [isOpen, setIsOpen] = useState(false);

  // Security measure: if rendered but not admin, return null
  if (role !== "admin") return null;

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: Briefcase },
    { href: "/users", label: "Users", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 bg-secondary border-b border-border sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold">
            SKS
          </div>
          <span className="text-xl font-bold tracking-tight">Agency</span>
        </Link>
        <button
          className="p-2 bg-background rounded-md"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-secondary border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center px-6 bg-secondary border-b border-border">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold">
              SKS
            </div>
            <span className="text-xl font-bold tracking-tight">Agency</span>
          </Link>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)] justify-between py-4">
          <nav className="space-y-1 px-3">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3">
            <div className="mb-4 px-3 py-2">
              <p className="text-sm font-medium text-white">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
