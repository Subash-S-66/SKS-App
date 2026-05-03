"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Video, ExternalLink, Calendar, CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function ProjectDemos({ project, onUpdate }: { project: any, onUpdate: (p: any) => void }) {
  const { data: session } = useSession();
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    demoDate: new Date().toISOString().split("T")[0],
    clientAttended: true,
    demoLink: "",
    recordingLink: "",
    feedback: "",
    outcome: "approved",
    changeRequests: "",
  });

  const canAddDemo = session?.user?.role === "admin" || session?.user?.role === "bde";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${project._id}/demos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Demo recorded successfully");
        setIsNewOpen(false);
        const updatedProject = await res.json();
        onUpdate(updatedProject);
        // Reset form
        setFormData({
          demoDate: new Date().toISOString().split("T")[0],
          clientAttended: true,
          demoLink: "",
          recordingLink: "",
          feedback: "",
          outcome: "approved",
          changeRequests: "",
        });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to record demo");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'approved': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Approved</Badge>;
      case 'changes_requested': return <Badge className="bg-yellow-500 hover:bg-yellow-600"><AlertCircle className="w-3 h-3 mr-1"/> Changes Req</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      case 'rescheduled': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1"/> Rescheduled</Badge>;
      default: return <Badge>{outcome}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center"><Video className="w-5 h-5 mr-2" /> Demos & Meetings</h3>
        {canAddDemo && (
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Record Demo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Demo/Meeting</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={formData.demoDate} onChange={e => setFormData({...formData, demoDate: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Outcome</Label>
                    <Select value={formData.outcome} onValueChange={(v) => { if(v) setFormData({...formData, outcome: v}) }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="changes_requested">Changes Requested</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="rescheduled">Rescheduled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="clientAttended"
                    checked={formData.clientAttended}
                    onChange={e => setFormData({...formData, clientAttended: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="clientAttended" className="font-normal">Client Attended Meeting</Label>
                </div>

                <div className="space-y-2">
                  <Label>Meeting/Demo Link</Label>
                  <Input value={formData.demoLink} onChange={e => setFormData({...formData, demoLink: e.target.value})} placeholder="https://zoom.us/..." />
                </div>

                <div className="space-y-2">
                  <Label>Recording Link</Label>
                  <Input value={formData.recordingLink} onChange={e => setFormData({...formData, recordingLink: e.target.value})} placeholder="https://..." />
                </div>

                <div className="space-y-2">
                  <Label>Client Feedback / Notes</Label>
                  <Textarea value={formData.feedback} onChange={e => setFormData({...formData, feedback: e.target.value})} rows={3} />
                </div>

                {formData.outcome === 'changes_requested' && (
                  <div className="space-y-2">
                    <Label className="text-amber-600 dark:text-amber-500">Change Requests (To be converted to tasks)</Label>
                    <Textarea value={formData.changeRequests} onChange={e => setFormData({...formData, changeRequests: e.target.value})} rows={3} className="border-amber-200 focus-visible:ring-amber-500" />
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Save Record"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!project.demos || project.demos.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-lg text-slate-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No demos or meetings have been recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
          {project.demos.slice().reverse().map((demo: any, idx: number) => (
            <div key={demo._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <Video className="w-4 h-4" />
              </div>

              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{format(new Date(demo.demoDate), 'MMMM dd, yyyy')}</h4>
                      <p className="text-xs text-slate-500">Conducted by: {demo.conductedBy?.name || 'Unknown'}</p>
                    </div>
                    {getOutcomeBadge(demo.outcome)}
                  </div>

                  <div className="text-sm space-y-3">
                    <p className="flex items-center gap-2">
                      <span className="text-slate-500">Client Attended:</span>
                      <span className={demo.clientAttended ? "text-green-600" : "text-red-500 font-medium"}>
                        {demo.clientAttended ? "Yes" : "No (No Show)"}
                      </span>
                    </p>

                    {demo.feedback && (
                      <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-slate-700 dark:text-slate-300">
                        <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Feedback</span>
                        {demo.feedback}
                      </div>
                    )}

                    {demo.changeRequests && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 p-3 rounded text-amber-900 dark:text-amber-200">
                        <span className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-500 block mb-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Change Requests</span>
                        {demo.changeRequests}
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      {demo.demoLink && (
                        <a href={demo.demoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1 text-xs font-medium">
                          <ExternalLink className="w-3 h-3" /> Meeting Link
                        </a>
                      )}
                      {demo.recordingLink && (
                        <a href={demo.recordingLink} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline flex items-center gap-1 text-xs font-medium">
                          <Video className="w-3 h-3" /> View Recording
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}