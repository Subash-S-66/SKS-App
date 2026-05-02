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
import PaymentsTab from "./components/PaymentsTab";
import DemosTab from "./components/DemosTab";
import ActivityTab from "./components/ActivityTab";

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
    const isOverdue = p.expectedDeliveryDate &&
                      isPast(startOfDay(new Date(p.expectedDeliveryDate))) &&
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
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{project.clientName}</h2>
            {getStatusBadge(project)}
            {project.payment?.paymentStatus === "fully_paid" ? <Badge variant="success">Fully Paid</Badge> :
             project.payment?.paymentStatus === "partially_paid" ? <Badge variant="warning">Partially Paid</Badge> :
             <Badge variant="danger">Unpaid</Badge>}
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            {project.companyName} &bull; #{project.sNo} &bull; {project.typeOfJob} &bull;
            {project.payment?.currency === "USD" ? "$" : project.payment?.currency === "EUR" ? "€" : "₹"}{project.payment?.amountReceived || 0} / {project.payment?.currency === "USD" ? "$" : project.payment?.currency === "EUR" ? "€" : "₹"}{project.projectBudget}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
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
            }} className="whitespace-nowrap">
              Mark as {project.status === "completed" ? "Ongoing" : "Completed"}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="demos">Demos</TabsTrigger>
          {role !== "bde" && <TabsTrigger value="credentials">Credentials & Links</TabsTrigger>}
          <TabsTrigger value="team">Team & Shares</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab project={project} refreshProject={fetchProject} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab project={project} refreshProject={fetchProject} />
        </TabsContent>

        <TabsContent value="requirements">
          <RequirementsTab projectId={project._id} project={project} />
        </TabsContent>

        <TabsContent value="demos">
          <DemosTab project={project} refreshProject={fetchProject} />
        </TabsContent>

        {role !== "bde" && (
          <TabsContent value="credentials">
            <CredentialsTab projectId={project._id} project={project} refreshProject={fetchProject} />
          </TabsContent>
        )}

        <TabsContent value="team">
          <TeamTab project={project} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab projectId={project._id} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
