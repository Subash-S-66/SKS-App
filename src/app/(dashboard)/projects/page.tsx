"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Search, Plus, ExternalLink } from "lucide-react";
import { format, isPast, startOfDay } from "date-fns";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    setLoading(true);
    let url = "/api/projects";
    if (filter !== "all") {
      url += `?status=${filter}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  };

  const getStatusBadge = (project: any) => {
    const isOverdue = project.deadlineDate &&
                      isPast(startOfDay(new Date(project.deadlineDate))) &&
                      (project.status === "ongoing" || project.status === "on hold");

    if (isOverdue) return <Badge variant="danger">Overdue</Badge>;
    if (project.status === "completed") return <Badge variant="success">Completed</Badge>;
    if (project.status === "on hold") return <Badge variant="warning">On Hold</Badge>;
    return <Badge variant="info">Ongoing</Badge>;
  };

  const filteredProjects = projects.filter(p =>
    p.clientName.toLowerCase().includes(search.toLowerCase()) ||
    p.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground mt-1">Manage and track project progress</p>
        </div>
        {role === "admin" && (
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 space-x-0 sm:space-x-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or company..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {["all", "ongoing", "completed", "on hold"].map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize whitespace-nowrap"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">S.No</th>
                  <th className="px-6 py-4">Client / Company</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 hidden md:table-cell">Team</th>
                  <th className="px-6 py-4 hidden lg:table-cell">Start Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Loading projects...
                    </td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No projects found.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project._id} className="border-b border-border hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">#{project.sNo}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{project.clientName}</div>
                        <div className="text-xs text-muted-foreground">{project.companyName}</div>
                      </td>
                      <td className="px-6 py-4">{project.typeOfJob}</td>
                      <td className="px-6 py-4">{getStatusBadge(project)}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex -space-x-2 overflow-hidden">
                          {project.assignedBDE && (
                            <div className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-primary flex items-center justify-center text-xs font-medium text-white" title={`BDE: ${project.assignedBDE.name}`}>
                              {project.assignedBDE.name.charAt(0)}
                            </div>
                          )}
                          {project.assignedDevelopers?.map((dev: any, i: number) => (
                            <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-info flex items-center justify-center text-xs font-medium text-white" title={`Dev: ${dev.name}`}>
                              {dev.name.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground">
                        {format(new Date(project.startDate), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <Link href={`/projects/${project._id}`}>
                          <Button variant="ghost" size="sm">
                            View <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
