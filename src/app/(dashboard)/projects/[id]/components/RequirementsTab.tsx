"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Plus, MessageSquare, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function RequirementsTab({ projectId, project }: { projectId: string, project: any }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [logNote, setLogNote] = useState("");

  const [isEditingReq, setIsEditingReq] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const canEditLog = role === "admin" || (role === "developer" && project.assignedDevelopers.some((d:any) => d._id === userId));
  const canEditReq = role === "admin";

  useEffect(() => {
    fetchRequirements();
  }, [projectId]);

  const fetchRequirements = async () => {
    try {
      const res = await fetch(`/api/requirements?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setRequirements(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title, description }),
      });
      if (res.ok) {
        toast.success("Requirement added");
        setIsAddOpen(false);
        setTitle("");
        setDescription("");
        fetchRequirements();
      } else {
        toast.error("Failed to add requirement");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleUpdateStatus = async (reqId: string, status: string) => {
    try {
      const res = await fetch(`/api/requirements/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Status updated");
        const updated = await res.json();
        setSelectedReq(updated);
        fetchRequirements();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNote.trim()) return;
    try {
      const res = await fetch(`/api/requirements/${selectedReq._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logNote }),
      });
      if (res.ok) {
        toast.success("Log added");
        setLogNote("");
        const updated = await res.json();
        setSelectedReq(updated);
        fetchRequirements();
      }
    } catch (error) {
      toast.error("Failed to add log");
    }
  };

  const handleSaveReqEdit = async () => {
    try {
      const res = await fetch(`/api/requirements/${selectedReq._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      if (res.ok) {
        toast.success("Requirement updated");
        const updated = await res.json();
        setSelectedReq(updated);
        setIsEditingReq(false);
        fetchRequirements();
      } else {
        toast.error("Failed to update requirement");
      }
    } catch {
      toast.error("Error updating requirement");
    }
  };

  const handleDeleteReq = async () => {
    if (!confirm("Are you sure you want to delete this requirement?")) return;
    try {
      const res = await fetch(`/api/requirements/${selectedReq._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Requirement deleted");
        setIsDetailOpen(false);
        fetchRequirements();
      } else {
        toast.error("Failed to delete requirement");
      }
    } catch {
      toast.error("Error deleting requirement");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "success";
    if (status === "ongoing") return "info";
    return "warning";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Project Requirements</h3>
        {canEditLog && (
          <Button onClick={() => setIsAddOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Requirement
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : requirements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <p>No requirements added yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requirements.map((req) => (
            <Card
              key={req._id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setSelectedReq(req);
                setIsEditingReq(false);
                setIsDetailOpen(true);
              }}
            >
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold line-clamp-1 flex-1 mr-2">{req.title}</h4>
                  <Badge variant={getStatusColor(req.status)}>{req.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{req.description}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Logs: {req.developerLogs.length}</span>
                  <span>{format(new Date(req.createdAt), "MMM dd")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Requirement">
        <form onSubmit={handleAddRequirement} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <textarea
              required
              className="flex min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Detail & Logs Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={isEditingReq ? "Edit Requirement" : "Requirement Details"} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {selectedReq && (
          <div className="space-y-6">
            {!isEditingReq ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{selectedReq.title}</h3>
                      <Badge variant={getStatusColor(selectedReq.status)}>{selectedReq.status}</Badge>
                    </div>
                    {canEditReq && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditTitle(selectedReq.title);
                          setEditDescription(selectedReq.description);
                          setIsEditingReq(true);
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10" onClick={handleDeleteReq}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReq.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">Added by {selectedReq.addedBy.name}</p>
                </div>

                {canEditLog && (
                  <div className="flex gap-2">
                    {["pending", "ongoing", "completed"].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={selectedReq.status === s ? "default" : "outline"}
                        onClick={() => handleUpdateStatus(selectedReq._id, s)}
                        className="capitalize"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="border-t border-border pt-6">
                  <h4 className="font-semibold mb-4">Developer Logs</h4>

                  <div className="space-y-4 mb-6">
                    {selectedReq.developerLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No logs added yet.</p>
                    ) : (
                      selectedReq.developerLogs.map((log: any, i: number) => (
                        <div key={i} className="bg-background rounded p-3 border border-border">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-semibold">{log.developer.name}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "MMM dd, hh:mm a")}</span>
                          </div>
                          <p className="text-sm">{log.note}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {canEditLog && (
                    <form onSubmit={handleAddLog} className="space-y-3">
                      <Label>Add Log Note</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        placeholder="What did you work on?"
                        value={logNote}
                        onChange={(e) => setLogNote(e.target.value)}
                      />
                      <Button type="submit" size="sm" disabled={!logNote.trim()}>Add Log</Button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditingReq(false)}>Cancel</Button>
                  <Button onClick={handleSaveReqEdit}>Save Changes</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
