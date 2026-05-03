"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Loader2 } from "lucide-react";
import { FirstTimeSetupBanner } from "./FirstTimeSetupBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {session?.user?.role === "admin" && <FirstTimeSetupBanner />}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
