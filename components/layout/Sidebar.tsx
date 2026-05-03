"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, FolderKanban, Users, Settings, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (role !== "admin") return null;

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      visible: true,
    },
    {
      label: "Projects",
      icon: FolderKanban,
      href: "/projects",
      visible: true,
    },
    {
      label: "New Project",
      icon: PlusCircle,
      href: "/projects/new",
      visible: true,
    },
    {
      label: "Users",
      icon: Users,
      href: "/users",
      visible: true,
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      visible: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white w-64 p-4 border-r border-slate-800 shrink-0 hidden md:flex">
      <div className="flex items-center justify-center mb-8">
        <h1 className="text-2xl font-bold text-blue-500 tracking-wider">SKS<span className="text-white text-lg ml-1 font-semibold tracking-normal">AGENCY</span></h1>
      </div>
      <nav className="flex-1 space-y-2">
        {routes.map(
          (route) =>
            route.visible && (
              <Link
                key={route.href}
                href={route.href}
                onClick={onNavigate}
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
            )
        )}
      </nav>
    </div>
  );
}