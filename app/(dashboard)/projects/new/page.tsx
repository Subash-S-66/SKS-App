"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const [bdes, setBdes] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    typeOfJob: "",
    features: "",
    assignedBDE: "",
    assignedDevelopers: [] as string[],
    status: "ongoing",
    startDate: new Date().toISOString().split("T")[0],
    monthForProject: "",
    projectBudget: "",
    currency: "INR",
    demoScheduledDate: "",
    githubUrl: "",
    finalUrl: "",
    projectDescription: "",
    expectedDeliveryDate: "",
    isDemoRequired: false,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const users = await res.json();
          setBdes(users.filter((u: any) => u.role === "bde"));
          setDevelopers(users.filter((u: any) => u.role === "developer"));
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDevToggle = (devId: string) => {
    setFormData((prev) => {
      const isSelected = prev.assignedDevelopers.includes(devId);
      if (isSelected) {
        return { ...prev, assignedDevelopers: prev.assignedDevelopers.filter(id => id !== devId) };
      } else {
        if (prev.assignedDevelopers.length >= 2) {
          toast.error("Maximum 2 developers can be assigned");
          return prev;
        }
        return { ...prev, assignedDevelopers: [...prev.assignedDevelopers, devId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.companyName || !formData.assignedBDE || formData.assignedDevelopers.length === 0) {
      toast.error("Please fill required fields (Client, Company, BDE, at least 1 Dev)");
      return;
    }

    // Calculate shares
    const bdeShare = 20;
    const devShares = formData.assignedDevelopers.length === 1 ? [80] : [40, 40];

    const payload = {
      ...formData,
      projectBudget: Number(formData.projectBudget),
      sharePercentages: {
        bde: bdeShare,
        developers: devShares
      },
      payment: {
        totalAmount: Number(formData.projectBudget),
        currency: formData.currency,
        amountReceived: 0,
        amountPending: Number(formData.projectBudget),
        isFullyPaid: false,
        paymentStatus: 'unpaid'
      },
      links: {
        githubUrl: formData.githubUrl,
        finalUrl: formData.finalUrl
      }
    };

    try {
      setLoading(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Project created successfully");
        router.push("/projects");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create project");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Create New Project</h2>
        <Button variant="outline" onClick={() => router.back()} className="w-full md:w-auto">Cancel</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input id="clientName" name="clientName" value={formData.clientName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="typeOfJob">Type of Job *</Label>
                <Input id="typeOfJob" name="typeOfJob" placeholder="e.g. Website, SEO" value={formData.typeOfJob} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectBudget">Total Project Amount *</Label>
                <div className="flex gap-2">
                  <Select value={formData.currency} onValueChange={(v) => { if(v) handleSelectChange("currency", v) }}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Cur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input id="projectBudget" name="projectBudget" type="number" className="flex-1" value={formData.projectBudget} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                <Input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" value={formData.expectedDeliveryDate} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthForProject">Target Month *</Label>
                <Input id="monthForProject" name="monthForProject" placeholder="e.g. May 2025" value={formData.monthForProject} onChange={handleChange} required />
              </div>
              <div className="space-y-2 flex items-center pt-8">
                <input
                  type="checkbox"
                  id="isDemoRequired"
                  checked={formData.isDemoRequired}
                  onChange={(e) => setFormData(prev => ({...prev, isDemoRequired: e.target.checked}))}
                  className="w-4 h-4 rounded border-gray-300 mr-2"
                />
                <Label htmlFor="isDemoRequired" className="font-normal cursor-pointer">Demo Required?</Label>
              </div>
              {formData.isDemoRequired && (
                <div className="space-y-2">
                  <Label htmlFor="demoScheduledDate">Demo Scheduled Date</Label>
                  <Input id="demoScheduledDate" name="demoScheduledDate" type="date" value={formData.demoScheduledDate} onChange={handleChange} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input id="githubUrl" name="githubUrl" placeholder="https://github.com/..." value={formData.githubUrl} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="finalUrl">Live / Final URL</Label>
                <Input id="finalUrl" name="finalUrl" placeholder="https://..." value={formData.finalUrl} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features / Client Requirements</Label>
              <Textarea id="features" name="features" rows={3} value={formData.features} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription">Internal Admin Notes (Optional)</Label>
              <Textarea id="projectDescription" name="projectDescription" rows={2} value={formData.projectDescription} onChange={handleChange} placeholder="Private notes visible only to admin..." />
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-medium mb-4">Team Assignment & Shares</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Assign BDE (20% Share) *</Label>
                  <Select value={formData.assignedBDE} onValueChange={(v) => { if (v) handleSelectChange("assignedBDE", v); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select BDE" />
                    </SelectTrigger>
                    <SelectContent>
                      {bdes.map((bde: any) => (
                        <SelectItem key={bde._id} value={bde._id}>{bde.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Assign Developers (Max 2) *</Label>
                  <div className="border rounded-md p-4 space-y-2 bg-slate-50 dark:bg-slate-900 max-h-48 overflow-y-auto">
                    {developers.map((dev: any) => (
                      <div key={dev._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`dev-${dev._id}`}
                          checked={formData.assignedDevelopers.includes(dev._id)}
                          onChange={() => handleDevToggle(dev._id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <Label htmlFor={`dev-${dev._id}`} className="font-normal cursor-pointer">
                          {dev.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500">
                    {formData.assignedDevelopers.length === 0 && "Select at least 1 developer"}
                    {formData.assignedDevelopers.length === 1 && "1 Developer: 80% Share"}
                    {formData.assignedDevelopers.length === 2 && "2 Developers: 40% Share each"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={loading} className="w-full md:w-auto h-12 md:h-10">
                {loading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}