"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, User, LogOut, Menu } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "My Projects", icon: Briefcase },
    { href: "/settings", label: "Profile", icon: User },
  ];

  return (
    <div className="border-b border-border bg-secondary">
      <div className="flex h-16 items-center px-4 md:px-6 justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold">
            SKS
          </div>
          <span className="text-xl font-bold tracking-tight hidden sm:inline-block">Agency</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-medium text-white">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign Out</span>
          </button>
        </div>

        {/* Mobile Nav Toggle */}
        <button
          className="md:hidden p-2 bg-background rounded-md text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-secondary absolute w-full z-40 shadow-lg">
          <nav className="flex flex-col p-4 space-y-2">
            <div className="mb-4 pb-4 border-b border-border">
              <p className="text-sm font-medium text-white">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center rounded-md px-3 py-3 text-base font-medium transition-colors",
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
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center rounded-md px-3 py-3 mt-4 text-base font-medium text-danger hover:bg-danger/10 transition-colors border border-danger/20"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
