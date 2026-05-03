"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Menu, LayoutDashboard, FolderKanban, Settings, Users as UsersIcon, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = session?.user?.role;

  const bdeDevRoutes = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "My Projects", href: "/projects" },
  ];

  const adminMobileRoutes = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Projects", icon: FolderKanban, href: "/projects" },
    { label: "New Project", icon: PlusCircle, href: "/projects/new" },
    { label: "Users", icon: UsersIcon, href: "/users" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger (Admin gets Sidebar via Sheet, BDE/Dev get simplified Sheet or just rely on Top Nav if fits) */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-slate-950 text-white border-r border-slate-800 p-0">
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-center mb-8 mt-4">
                <h1 className="text-2xl font-bold text-blue-500 tracking-wider">SKS<span className="text-white text-lg ml-1 font-semibold tracking-normal">AGENCY</span></h1>
              </div>
              <nav className="flex-1 space-y-2">
                {role === "admin" ? (
                  adminMobileRoutes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md transition-colors",
                        pathname === route.href || (pathname.startsWith(route.href + '/') && route.href !== '/projects')
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      <route.icon className="w-5 h-5 mr-3" />
                      {route.label}
                    </Link>
                  ))
                ) : (
                  bdeDevRoutes.map((route) => (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md transition-colors",
                        pathname === route.href || (pathname.startsWith(route.href + '/') && route.href !== '/projects')
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      {route.label}
                    </Link>
                  ))
                )}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo for mobile */}
        <h1 className="text-xl font-bold text-blue-600 tracking-wider md:hidden">SKS</h1>

        {/* Desktop Top Nav for BDE/Dev */}
        {role !== "admin" && (
          <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            {bdeDevRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  pathname === route.href || (pathname.startsWith(route.href + '/') && route.href !== '/projects')
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {route.label}
              </Link>
            ))}
          </div>
        )}

        {/* Welcome Text Desktop Admin */}
        {role === "admin" && (
          <h2 className="hidden md:block text-xl font-semibold capitalize dark:text-white">
            Welcome, {session?.user?.name || "Admin"}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden sm:block text-xs font-medium uppercase tracking-wider text-slate-500 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-full">
          {session?.user?.role}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 md:h-10 md:w-10 rounded-full p-0 flex items-center justify-center bg-transparent border-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <Avatar className="h-9 w-9 md:h-10 md:w-10">
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {session?.user?.name?.[0]?.toUpperCase() || <User size={18} />}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
                <p className="text-xs font-semibold text-blue-600 uppercase mt-1 sm:hidden">
                  Role: {session?.user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-red-600 cursor-pointer focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}