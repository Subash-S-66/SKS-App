"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { FirstTimeSetupBanner } from "./FirstTimeSetupBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null; // Middleware will handle redirect
  }

  const role = (session.user as any).role;
  const isAdmin = role === "admin";

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {!isAdmin && <div className="md:hidden"><FirstTimeSetupBanner /></div>}

      {isAdmin ? (
        <>
          <Sidebar />
          <div className="flex flex-col flex-1 w-full md:pl-64 h-screen">
            <div className="hidden md:block"><FirstTimeSetupBanner /></div>
            <div className="md:hidden"><FirstTimeSetupBanner /></div>
            <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </>
      ) : (
        <div className="flex flex-col flex-1 w-full min-h-screen">
          <div className="hidden md:block"><FirstTimeSetupBanner /></div>
          <TopNav />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      )}
    </div>
  );
}
