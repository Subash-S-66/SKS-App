"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Briefcase, CheckCircle, Clock, Users, UserCheck, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

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
        <CardContent className="p-6 flex items-center space-x-4">
          <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{loading ? "-" : value}</h3>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderAdminDashboard = () => {
    const pieData = [
      { name: "Ongoing", value: stats?.ongoing || 0, color: "var(--info)" },
      { name: "Completed", value: stats?.completed || 0, color: "var(--success)" },
    ];

    return (
      <div className="space-y-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
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
                  No project data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderBDEDashboard = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-3">
      <StatCard title="My Projects" value={stats?.totalProjects} icon={Briefcase} colorClass="bg-primary" />
      <StatCard title="Ongoing" value={stats?.ongoing} icon={Clock} colorClass="bg-info" />
      <StatCard title="Completed" value={stats?.completed} icon={CheckCircle} colorClass="bg-success" />
    </motion.div>
  );

  const renderDeveloperDashboard = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="My Projects" value={stats?.totalProjects} icon={Briefcase} colorClass="bg-primary" />
      <StatCard title="Ongoing" value={stats?.ongoing} icon={Clock} colorClass="bg-info" />
      <StatCard title="Completed" value={stats?.completed} icon={CheckCircle} colorClass="bg-success" />
      <StatCard title="Pending Tasks" value={stats?.pendingTasks} icon={LayoutDashboard} colorClass="bg-warning" />
    </motion.div>
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between space-y-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
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
