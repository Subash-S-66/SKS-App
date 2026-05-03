"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function ProjectRequirements({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [activeReq, setActiveReq] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // New Req Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Dev Log Form
  const [newLog, setNewLog] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");

  const fetchRequirements = async () => {
    try {
      const res = await fetch(`/api/requirements?projectId=${projectId}`);
      const data = await res.json();
      setRequirements(data);
    } catch (error) {
      toast.error("Failed to load requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title, description }),
      });
      if (res.ok) {
        toast.success("Requirement added");
        setIsNewOpen(false);
        setTitle("");
        setDescription("");
        fetchRequirements();
      }
    } catch (error) {
      toast.error("Error creating requirement");
    }
  };

  const handleUpdateReq = async () => {
    if (!activeReq) return;
    try {
      const res = await fetch(`/api/requirements/${activeReq._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusUpdate || undefined,
          newLog: newLog || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Requirement updated");
        setNewLog("");
        setIsDetailOpen(false);
        fetchRequirements();
      }
    } catch (error) {
      toast.error("Error updating requirement");
    }
  };

  const openDetail = (req: any) => {
    setActiveReq(req);
    setStatusUpdate(req.status);
    setNewLog("");
    setIsDetailOpen(true);
  };

  if (loading) return <div>Loading requirements...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Requirements & Tasks</h3>
        {(session?.user?.role === "admin" || session?.user?.role === "developer") && (
          <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
            <DialogTrigger>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Requirement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Save Requirement</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requirements.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 border rounded-lg bg-slate-50 dark:bg-slate-900">
            No requirements added yet.
          </div>
        ) : (
          requirements.map((req) => (
            <div
              key={req._id}
              className="border rounded-lg p-4 bg-white dark:bg-slate-950 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              onClick={() => openDetail(req)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium line-clamp-1 flex-1 pr-2">{req.title}</h4>
                <Badge variant={
                  req.status === 'completed' ? 'default' :
                  req.status === 'ongoing' ? 'secondary' : 'outline'
                } className="shrink-0 text-xs">
                  {req.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{req.description}</p>

              <div className="flex justify-between items-center text-xs text-slate-400 mt-auto pt-3 border-t">
                <div className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {req.developerLogs?.length || 0} logs
                </div>
                <div>Added by {req.addedBy?.name.split(" ")[0]}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {activeReq && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-xl">{activeReq.title}</DialogTitle>
                  <Badge>{activeReq.status}</Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div>
                  <h5 className="text-sm font-semibold mb-1 text-slate-500">Description</h5>
                  <p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md">{activeReq.description}</p>
                </div>

                {/* Developer Updates Section */}
                {(session?.user?.role === "admin" || session?.user?.role === "developer") && (
                  <div className="space-y-4 border p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/10">
                    <h5 className="font-semibold flex items-center"><Plus className="w-4 h-4 mr-2"/> Add Update</h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Textarea
                          placeholder="Add dev log or note..."
                          value={newLog}
                          onChange={(e) => setNewLog(e.target.value)}
                          className="h-full"
                        />
                      </div>
                      <div className="space-y-3">
                        <Select value={statusUpdate} onValueChange={(v) => { if(v) setStatusUpdate(v); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleUpdateReq}
                          className="w-full"
                          disabled={!newLog && statusUpdate === activeReq.status}
                        >
                          Submit Update
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h5 className="text-sm font-semibold mb-3 text-slate-500">Activity Logs</h5>
                  <div className="space-y-4">
                    {activeReq.developerLogs?.length === 0 ? (
                      <p className="text-sm text-slate-500">No activity logged yet.</p>
                    ) : (
                      activeReq.developerLogs.map((log: any, i: number) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                            {i !== activeReq.developerLogs.length - 1 && (
                              <div className="w-px h-full bg-slate-200 dark:bg-slate-700 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex justify-between items-start">
                              <span className="font-medium">{log.developer?.name || "Developer"}</span>
                              <span className="text-xs text-slate-400">
                                {format(new Date(log.timestamp), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">{log.note}</p>
                          </div>
                        </div>
                      )).reverse()
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}