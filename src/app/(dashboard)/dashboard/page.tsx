"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Briefcase, CheckCircle, Clock, Users, UserCheck, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';

const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const RechartsTooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <motion.div variants={item}>
      <Card>
        <CardContent className="p-4 md:p-6 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-xl md:text-2xl font-bold">{loading ? "-" : value}</h3>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const MiniStats = () => (
    <div className="bg-secondary/50 rounded-lg p-4 mb-6 border border-border">
      <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:pr-4 sm:border-r border-border">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Weekly Stamina</span>
          <span className="font-bold text-lg sm:text-xl text-primary mt-1 sm:mt-0">2000</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:border-r border-border">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Active Members</span>
          <span className="font-bold text-lg sm:text-xl text-info mt-1 sm:mt-0">2 / 22</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:pl-4">
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Avg per Member</span>
          <span className="font-bold text-lg sm:text-xl text-success mt-1 sm:mt-0">90.9</span>
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => {
    const pieData = [
      { name: "Ongoing", value: stats?.ongoing || 0, color: "var(--info)" },
      { name: "Completed", value: stats?.completed || 0, color: "var(--success)" },
    ];

    return (
      <div className="space-y-6">
        <MiniStats />
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          <StatCard title="Total Projects" value={stats?.totalProjects} icon={Briefcase} colorClass="bg-primary" />
          <StatCard title="Ongoing Projects" value={stats?.ongoing} icon={Clock} colorClass="bg-info" />
          <StatCard title="Completed Projects" value={stats?.completed} icon={CheckCircle} colorClass="bg-success" />
          <StatCard title="Total Users" value={stats?.totalUsers} icon={Users} colorClass="bg-secondary border border-border" />
          <StatCard title="Total BDEs" value={stats?.totalBDEs} icon={UserCheck} colorClass="bg-secondary border border-border" />
          <StatCard title="Total Developers" value={stats?.totalDevs} icon={LayoutDashboard} colorClass="bg-secondary border border-border" />
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Projects by Status</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {stats && (stats.ongoing > 0 || stats.completed > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderBDEDashboard = () => (
    <>
      <MiniStats />
      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard title="My Projects" value={stats?.totalProjects} icon={Briefcase} colorClass="bg-primary" />
        <StatCard title="Ongoing" value={stats?.ongoing} icon={Clock} colorClass="bg-info" />
        <StatCard title="Completed" value={stats?.completed} icon={CheckCircle} colorClass="bg-success" />
      </motion.div>
    </>
  );

  const renderDeveloperDashboard = () => (
    <>
      <MiniStats />
      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="My Projects" value={stats?.totalProjects} icon={Briefcase} colorClass="bg-primary" />
        <StatCard title="Ongoing" value={stats?.ongoing} icon={Clock} colorClass="bg-info" />
        <StatCard title="Completed" value={stats?.completed} icon={CheckCircle} colorClass="bg-success" />
        <StatCard title="Pending Tasks" value={stats?.pendingTasks} icon={LayoutDashboard} colorClass="bg-warning" />
      </motion.div>
    </>
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between space-y-2 mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24 bg-secondary/50" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {role === "admin" && renderAdminDashboard()}
          {role === "bde" && renderBDEDashboard()}
          {role === "developer" && renderDeveloperDashboard()}
        </>
      )}
    </DashboardLayout>
  );
}
