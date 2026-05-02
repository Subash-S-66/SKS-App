"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { ExternalLink, Plus, MessageSquare } from "lucide-react";

export default function DemosTab({ project, refreshProject }: { project: any, refreshProject: () => void }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    demoDate: new Date().toISOString().split('T')[0],
    clientAttended: true,
    demoLink: "",
    recordingLink: "",
    feedback: "",
    outcome: "rescheduled",
    changeRequests: "",
  });

  const canEdit = role === "admin" || role === "bde";
  const demos = project.demos || [];

  const handleAddDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newDemo = {
        ...formData,
        conductedBy: userId,
      };

      const res = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demos: [...demos, newDemo] }),
      });

      if (res.ok) {
        toast.success("Demo recorded");
        setIsAddOpen(false);
        setFormData({
          demoDate: new Date().toISOString().split('T')[0],
          clientAttended: true,
          demoLink: "", recordingLink: "", feedback: "", outcome: "rescheduled", changeRequests: "",
        });
        refreshProject();
      } else {
        toast.error("Failed to record demo");
      }
    } catch {
      toast.error("Error recording demo");
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    if (outcome === "approved") return <Badge variant="success">Approved</Badge>;
    if (outcome === "changes_requested") return <Badge variant="warning">Changes Requested</Badge>;
    if (outcome === "rejected") return <Badge variant="danger">Rejected</Badge>;
    return <Badge variant="outline">Scheduled / Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Client Demos</h3>
        {canEdit && (
          <Button size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Schedule / Log Demo
          </Button>
        )}
      </div>

      {demos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>No demos recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative border-l border-border ml-4 space-y-8 pb-4">
          {demos.map((demo: any, i: number) => (
            <div key={i} className="relative pl-6">
              <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 ring-4 ring-background"></div>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{format(new Date(demo.demoDate || demo.createdAt), "EEEE, MMM dd, yyyy")}</h4>
                      <p className="text-sm text-muted-foreground">Conducted by: {project.assignedBDE?.name || "Admin"}</p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      {getOutcomeBadge(demo.outcome)}
                      <span className="text-xs text-muted-foreground">Client Attended: {demo.clientAttended ? "Yes" : "No"}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {demo.demoLink && (
                      <a href={demo.demoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-primary hover:underline">
                        <ExternalLink className="h-3 w-3 mr-1" /> Meeting Link
                      </a>
                    )}
                    {demo.recordingLink && (
                      <a href={demo.recordingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-info hover:underline ml-4">
                        <ExternalLink className="h-3 w-3 mr-1" /> Recording Link
                      </a>
                    )}

                    {demo.feedback && (
                      <div className="bg-secondary/50 p-3 rounded text-sm mt-2 border border-border">
                        <span className="font-semibold text-xs block mb-1 text-muted-foreground">Client Feedback:</span>
                        {demo.feedback}
                      </div>
                    )}

                    {demo.outcome === "changes_requested" && demo.changeRequests && (
                      <div className="bg-warning/10 text-warning-foreground p-3 rounded text-sm mt-2 border border-warning/30">
                        <span className="font-semibold text-xs block mb-1">Change Requests:</span>
                        {demo.changeRequests}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Demo">
        <form onSubmit={handleAddDemo} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pb-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Demo Date</Label>
              <Input type="date" required value={formData.demoDate} onChange={e => setFormData({...formData, demoDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Outcome</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})}>
                <option value="rescheduled">Scheduled / Pending</option>
                <option value="approved">Approved</option>
                <option value="changes_requested">Changes Requested</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="space-y-2 flex items-center gap-2 pt-2">
            <input type="checkbox" id="clientAttended" className="h-4 w-4 rounded border-border bg-background text-primary" checked={formData.clientAttended} onChange={e => setFormData({...formData, clientAttended: e.target.checked})} />
            <Label htmlFor="clientAttended">Client Attended?</Label>
          </div>
          <div className="space-y-2">
            <Label>Meeting Link</Label>
            <Input type="url" placeholder="Zoom/Meet URL..." value={formData.demoLink} onChange={e => setFormData({...formData, demoLink: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Recording Link</Label>
            <Input type="url" placeholder="Video URL..." value={formData.recordingLink} onChange={e => setFormData({...formData, recordingLink: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Feedback</Label>
            <textarea className="flex min-h-[60px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={formData.feedback} onChange={e => setFormData({...formData, feedback: e.target.value})} />
          </div>
          {formData.outcome === "changes_requested" && (
            <div className="space-y-2">
              <Label>Change Requests (Tasks for developers)</Label>
              <textarea className="flex min-h-[60px] w-full rounded-md border border-warning/50 bg-background px-3 py-2 text-sm" value={formData.changeRequests} onChange={e => setFormData({...formData, changeRequests: e.target.value})} />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit">Save Demo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
