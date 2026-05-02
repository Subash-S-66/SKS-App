"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isPast, startOfDay } from "date-fns";
import toast from "react-hot-toast";
import OverviewTab from "./components/OverviewTab";
import RequirementsTab from "./components/RequirementsTab";
import CredentialsTab from "./components/CredentialsTab";
import TeamTab from "./components/TeamTab";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      } else {
        toast.error("Failed to load project or unauthorized");
        router.push("/projects");
      }
    } catch (error) {
      toast.error("Error loading project");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (p: any) => {
    const isOverdue = p.deadlineDate &&
                      isPast(startOfDay(new Date(p.deadlineDate))) &&
                      (p.status === "ongoing" || p.status === "on hold");

    if (isOverdue) return <Badge variant="danger" className="text-sm">Overdue</Badge>;
    if (p.status === "completed") return <Badge variant="success" className="text-sm">Completed</Badge>;
    if (p.status === "on hold") return <Badge variant="warning" className="text-sm">On Hold</Badge>;
    return <Badge variant="info" className="text-sm">Ongoing</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading project details...
        </div>
      </DashboardLayout>
    );
  }

  if (!project) return null;

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold tracking-tight">{project.clientName}</h2>
            {getStatusBadge(project)}
          </div>
          <p className="text-muted-foreground">
            {project.companyName} &bull; #{project.sNo} &bull; {project.typeOfJob}
          </p>
        </div>
        <div className="flex gap-2">
          {role === "admin" && (
            <Button variant="outline" onClick={() => {
              const newStatus = project.status === "completed" ? "ongoing" : "completed";
              fetch(`/api/projects/${project._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
              }).then(() => {
                toast.success(`Marked as ${newStatus}`);
                fetchProject();
              });
            }}>
              Mark as {project.status === "completed" ? "Ongoing" : "Completed"}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          {role !== "bde" && <TabsTrigger value="credentials">Credentials</TabsTrigger>}
          <TabsTrigger value="team">Team & Shares</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab project={project} refreshProject={fetchProject} />
        </TabsContent>

        <TabsContent value="requirements">
          <RequirementsTab projectId={project._id} project={project} />
        </TabsContent>

        {role !== "bde" && (
          <TabsContent value="credentials">
            <CredentialsTab projectId={project._id} />
          </TabsContent>
        )}

        <TabsContent value="team">
          <TeamTab project={project} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
