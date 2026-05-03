"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectOverview } from "@/components/projects/ProjectOverview";
import { ProjectRequirements } from "@/components/projects/ProjectRequirements";
import { ProjectCredentials } from "@/components/projects/ProjectCredentials";
import { ProjectTeam } from "@/components/projects/ProjectTeam";
import { ProjectPayments } from "@/components/projects/ProjectPayments";
import { ProjectActivity } from "@/components/projects/ProjectActivity";
import { ProjectDemos } from "@/components/projects/ProjectDemos";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        } else {
          toast.error("Failed to load project details");
        }
      } catch (error) {
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-[300px]" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-6 mt-6">
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center py-12">Project not found or you don't have permission to view it.</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center">
              <span className="text-slate-400 mr-2 md:mr-3">#{project.sNo}</span>
              {project.clientName}
            </h2>
            <Badge variant={
              project.status === 'completed' ? 'default' :
              project.status === 'ongoing' ? 'secondary' : 'destructive'
            } className={
              project.status === 'completed' ? 'bg-green-500 hover:bg-green-600' :
              project.status === 'ongoing' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600'
            }>
              {project.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-slate-500">{project.companyName} • {project.typeOfJob}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        {/* Horizontal scroll container for mobile tabs */}
        <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 scrollbar-hide">
          <TabsList className="inline-flex w-max md:w-full md:grid md:grid-cols-7 h-11 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="demos">Demos</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="credentials">Credentials & Links</TabsTrigger>
            <TabsTrigger value="team">Team & Shares</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4 md:mt-6">
          <TabsContent value="overview" className="m-0 focus-visible:outline-none">
            <ProjectOverview project={project} />
          </TabsContent>
          <TabsContent value="demos" className="m-0 focus-visible:outline-none">
            <ProjectDemos project={project} onUpdate={(newProject) => setProject(newProject)} />
          </TabsContent>
          <TabsContent value="requirements" className="m-0 focus-visible:outline-none">
            <ProjectRequirements projectId={project._id} />
          </TabsContent>
          <TabsContent value="payments" className="m-0 focus-visible:outline-none">
            <ProjectPayments project={project} onUpdate={(newProject) => setProject(newProject)} />
          </TabsContent>
          <TabsContent value="credentials" className="m-0 focus-visible:outline-none">
            <ProjectCredentials projectId={project._id} projectLinks={project.links} onUpdate={(newProject) => setProject(newProject)} />
          </TabsContent>
          <TabsContent value="team" className="m-0 focus-visible:outline-none">
            <ProjectTeam project={project} />
          </TabsContent>
          <TabsContent value="activity" className="m-0 focus-visible:outline-none">
            <ProjectActivity projectId={project._id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}