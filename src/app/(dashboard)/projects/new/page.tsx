"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import toast from "react-hot-toast";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    typeOfJob: "",
    features: "",
    projectBudget: "",
    monthForProject: "",
    startDate: new Date().toISOString().split('T')[0],
    deadlineDate: "",
    assignedBDE: "",
    assignedDevelopers: [] as string[],
  });

  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      });
  }, []);

  const bdes = users.filter(u => u.role === "bde");
  const devs = users.filter(u => u.role === "developer");

  const handleDevChange = (devId: string) => {
    setFormData(prev => {
      const current = prev.assignedDevelopers;
      if (current.includes(devId)) {
        return { ...prev, assignedDevelopers: current.filter(id => id !== devId) };
      } else {
        if (current.length >= 2) {
          toast.error("Maximum 2 developers can be assigned");
          return prev;
        }
        return { ...prev, assignedDevelopers: [...current, devId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          projectBudget: Number(formData.projectBudget)
        }),
      });

      if (res.ok) {
        toast.success("Project created successfully");
        router.push("/projects");
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create project");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const bdeAssigned = !!formData.assignedBDE;
  const devCount = formData.assignedDevelopers.length;

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Project</h2>
          <p className="text-muted-foreground mt-1">Fill in the details to start a new project</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} id="project-form">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input id="clientName" required value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input id="companyName" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="typeOfJob">Type of Job *</Label>
                    <Input id="typeOfJob" placeholder="e.g. E-commerce Website, SEO" required value={formData.typeOfJob} onChange={e => setFormData({...formData, typeOfJob: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectBudget">Budget ($) *</Label>
                    <Input id="projectBudget" type="number" required value={formData.projectBudget} onChange={e => setFormData({...formData, projectBudget: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input id="startDate" type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadlineDate">Deadline Date (Optional)</Label>
                    <Input id="deadlineDate" type="date" value={formData.deadlineDate} onChange={e => setFormData({...formData, deadlineDate: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="monthForProject">Month/Year Reference</Label>
                    <Input id="monthForProject" placeholder="e.g. May 2025" value={formData.monthForProject} onChange={e => setFormData({...formData, monthForProject: e.target.value})} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="features">Key Features / Description</Label>
                    <textarea
                      id="features"
                      className="flex min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      value={formData.features}
                      onChange={e => setFormData({...formData, features: e.target.value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end">
              <Button type="submit" form="project-form" size="lg" disabled={loading}>
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Assign BDE</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={formData.assignedBDE}
                  onChange={e => setFormData({...formData, assignedBDE: e.target.value})}
                >
                  <option value="">Select BDE...</option>
                  {bdes.map(bde => (
                    <option key={bde._id} value={bde._id}>{bde.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  <span>Assign Developers (Max 2)</span>
                  <span className="text-muted-foreground text-xs">{formData.assignedDevelopers.length}/2 selected</span>
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-border rounded-md">
                  {devs.map(dev => (
                    <label key={dev._id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-white/5 rounded">
                      <input
                        type="checkbox"
                        className="rounded border-border bg-background text-primary"
                        checked={formData.assignedDevelopers.includes(dev._id)}
                        onChange={() => handleDevChange(dev._id)}
                      />
                      <span className="text-sm">{dev.name}</span>
                    </label>
                  ))}
                  {devs.length === 0 && <span className="text-sm text-muted-foreground">No developers available</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Share Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!bdeAssigned || devCount === 0) && (
                <div className="p-3 bg-warning/20 border border-warning text-warning-foreground rounded-md text-sm mb-4">
                  <span className="font-semibold">⚠ Shares not fully assigned</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>BDE Share</span>
                  <span className="font-semibold">20%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-info h-2 rounded-full" style={{ width: "20%" }}></div>
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {bdeAssigned ? "Assigned" : "Unallocated (Agency)"}
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span>Developer Share(s)</span>
                  <span className="font-semibold">80%</span>
                </div>
                <div className="flex w-full bg-secondary rounded-full h-2 overflow-hidden space-x-1">
                  {devCount === 0 && (
                    <div className="bg-muted h-2 w-full"></div>
                  )}
                  {devCount === 1 && (
                    <div className="bg-success h-2 w-full"></div>
                  )}
                  {devCount === 2 && (
                    <>
                      <div className="bg-success h-2 w-1/2"></div>
                      <div className="bg-success h-2 w-1/2"></div>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {devCount === 0 && "80% Unallocated (Agency)"}
                  {devCount === 1 && "1 Dev @ 80%"}
                  {devCount === 2 && "2 Devs @ 40% each"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
