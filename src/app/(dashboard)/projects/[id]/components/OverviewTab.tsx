"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function OverviewTab({ project, refreshProject }: { project: any, refreshProject: () => void }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const router = useRouter();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientName: project.clientName || "",
    companyName: project.companyName || "",
    typeOfJob: project.typeOfJob || "",
    projectBudget: project.projectBudget || 0,
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
    deadlineDate: project.deadlineDate ? new Date(project.deadlineDate).toISOString().split('T')[0] : "",
    expectedDeliveryDate: project.expectedDeliveryDate ? new Date(project.expectedDeliveryDate).toISOString().split('T')[0] : "",
    monthForProject: project.monthForProject || "",
    features: project.features || "",
    description: project.description || "",
  });

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          projectBudget: Number(formData.projectBudget)
        }),
      });

      if (res.ok) {
        toast.success("Project updated");
        setIsEditOpen(false);
        refreshProject();
      } else {
        toast.error("Failed to update project");
      }
    } catch {
      toast.error("Error updating project");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Project deleted");
        router.push("/projects");
      } else {
        toast.error("Failed to delete project");
      }
    } catch {
      toast.error("Error deleting project");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Project Details</CardTitle>
          {role === "admin" && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="font-medium">{project.payment?.currency === "USD" ? "$" : project.payment?.currency === "EUR" ? "€" : "₹"}{project.projectBudget}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">{format(new Date(project.startDate), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Delivery</p>
              <p className="font-medium">{project.expectedDeliveryDate ? format(new Date(project.expectedDeliveryDate), "MMM dd, yyyy") : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="font-medium">{project.deadlineDate ? format(new Date(project.deadlineDate), "MMM dd, yyyy") : "None"}</p>
            </div>
            {project.status === "completed" && project.completedDate && (
              <div className="col-span-2 bg-success/10 border border-success/30 rounded p-3">
                <p className="text-sm text-success font-medium">Completed On</p>
                <p className="font-bold text-success">{format(new Date(project.completedDate), "MMM dd, yyyy")}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Features & Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground bg-background rounded-md p-4 border border-border min-h-[100px]">
              {project.features || "No specific features provided."}
            </div>
          </CardContent>
        </Card>

        {role === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-muted-foreground bg-warning/10 text-warning-foreground border-warning/30 rounded-md p-4 border min-h-[80px]">
                {project.description || "No internal description provided."}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Project">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto px-1 pb-1">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input required value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Type of Job</Label>
              <Input required value={formData.typeOfJob} onChange={e => setFormData({...formData, typeOfJob: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input type="number" required value={formData.projectBudget} onChange={e => setFormData({...formData, projectBudget: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input type="date" value={formData.expectedDeliveryDate} onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Deadline Date</Label>
              <Input type="date" value={formData.deadlineDate} onChange={e => setFormData({...formData, deadlineDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Month/Year Reference</Label>
              <Input value={formData.monthForProject} onChange={e => setFormData({...formData, monthForProject: e.target.value})} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Features</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={formData.features}
                onChange={e => setFormData({...formData, features: e.target.value})}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Internal Description</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
