"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useSession } from "next-auth/react";

export function ProjectOverview({ project }: { project: any }) {
  const { data: session } = useSession();
  if (!project) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-500">Client Name</p>
            <p className="font-medium">{project.clientName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Company Name</p>
            <p className="font-medium">{project.companyName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Type of Job</p>
            <p className="font-medium">{project.typeOfJob}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Project Budget</p>
            <p className="font-medium font-mono">{project.payment?.currency || "INR"} {project.payment?.totalAmount || project.projectBudget}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-500">Start Date</p>
            <p className="font-medium">{format(new Date(project.startDate), 'MMMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Expected Delivery</p>
            <p className="font-medium">
              {project.expectedDeliveryDate ? format(new Date(project.expectedDeliveryDate), 'MMMM dd, yyyy') : "Not Set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Target Month</p>
            <p className="font-medium">{project.monthForProject}</p>
          </div>
          {project.completedDate && (
            <div>
              <p className="text-sm text-slate-500">Completed Date</p>
              <p className="font-medium text-green-600">{format(new Date(project.completedDate), 'MMMM dd, yyyy')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features / Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            {project.features || "No specific features listed."}
          </div>
        </CardContent>
      </Card>

      {session?.user?.role === "admin" && project.projectDescription && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-500 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block"></span>
              Admin Internal Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-amber-900 dark:text-amber-200/80">
              {project.projectDescription}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}