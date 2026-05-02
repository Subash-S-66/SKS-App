"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";
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

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full md:pl-64">
        <FirstTimeSetupBanner />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
