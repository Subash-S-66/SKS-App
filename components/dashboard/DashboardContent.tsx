"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { StatsCard } from "./StatsCard";
import { FolderKanban, CheckCircle, PauseCircle, Users, Briefcase, Code } from "lucide-react";

// Dynamically import Recharts component to avoid blocking initial load
const StatusChart = dynamic(() => import("./StatusChart"), { ssr: false });

export function DashboardContent() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !data) {
    return <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl w-full md:w-1/2" />
    </div>;
  }

  const role = session?.user?.role;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Projects"
          value={data.totalProjects}
          icon={FolderKanban}
        />
        <StatsCard
          title="Ongoing"
          value={data.ongoingProjects}
          icon={FolderKanban}
          className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
        />
        <StatsCard
          title="Completed"
          value={data.completedProjects}
          icon={CheckCircle}
          className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
        />
        <StatsCard
          title="On Hold"
          value={data.onHoldProjects}
          icon={PauseCircle}
          className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
        />
      </div>

      {role === "admin" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Total Users" value={data.totalUsers} icon={Users} />
          <StatsCard title="Total BDEs" value={data.totalBDEs} icon={Briefcase} />
          <StatsCard title="Total Developers" value={data.totalDevelopers} icon={Code} />
        </div>
      )}

      {role === "developer" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           <StatsCard title="Pending Tasks" value={data.pendingTasks || 0} icon={Code} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusChart
          data={{
            ongoing: data.ongoingProjects,
            completed: data.completedProjects,
            onHold: data.onHoldProjects,
          }}
        />
      </div>
    </div>
  );
}