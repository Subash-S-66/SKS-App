"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export function RequirementsTab({ projectId }: { projectId: string }) {
  const { data: session } = useSession()
  const isDeveloperOrAdmin = session?.user?.role === "developer" || session?.user?.role === "admin"

  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openNew, setOpenNew] = useState(false)
  const [openDetails, setOpenDetails] = useState(false)
  const [selectedReq, setSelectedReq] = useState<any>(null)

  // New Req State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // Update Req State
  const [status, setStatus] = useState("")
  const [logNote, setLogNote] = useState("")

  const fetchRequirements = async () => {
    try {
      const res = await fetch(`/api/requirements?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        setRequirements(data)
      }
    } catch (error) {
      toast.error("Failed to load requirements")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequirements()
  }, [projectId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title, description }),
      })
      if (res.ok) {
        toast.success("Requirement added")
        setOpenNew(false)
        setTitle("")
        setDescription("")
        fetchRequirements()
      } else {
        toast.error("Failed to add requirement")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq) return

    try {
      const res = await fetch(`/api/requirements/${selectedReq._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, logNote }),
      })
      if (res.ok) {
        toast.success("Requirement updated")
        setLogNote("")
        fetchRequirements()
        const updatedReq = await res.json()
        // Optimistically update selected req to show new log without closing modal
        const freshReq = requirements.find(r => r._id === updatedReq._id)
        if(freshReq) {
            // Need a re-fetch to get populated developer names in logs usually,
            // but we called fetchRequirements above so it will update shortly.
            setOpenDetails(false)
        }
      } else {
        toast.error("Failed to update requirement")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const openReqDetails = (req: any) => {
    setSelectedReq(req)
    setStatus(req.status)
    setLogNote("")
    setOpenDetails(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Requirements</h3>
        {isDeveloperOrAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Add Requirement</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 text-white border-slate-800">
              <DialogHeader>
                <DialogTitle>New Requirement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required className="bg-slate-950 border-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} required className="bg-slate-950 border-slate-800 min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Add Requirement</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="text-slate-400 p-8 text-center">Loading requirements...</div>
      ) : requirements.length === 0 ? (
        <div className="text-slate-400 p-8 text-center border border-dashed border-slate-800 rounded-lg">
          No requirements added yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requirements.map((req) => (
            <Card key={req._id} className="bg-slate-900 border-slate-800 text-white cursor-pointer hover:border-blue-500 transition-colors" onClick={() => openReqDetails(req)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{req.title}</CardTitle>
                  <Badge variant="outline" className={`
                    ${req.status === 'completed' ? 'border-green-500 text-green-400' : ''}
                    ${req.status === 'ongoing' ? 'border-blue-500 text-blue-400' : ''}
                    ${req.status === 'pending' ? 'border-slate-500 text-slate-400' : ''}
                  `}>
                    {req.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 line-clamp-2">{req.description}</p>
                <div className="mt-4 text-xs text-slate-500 flex justify-between">
                  <span>Added by {req.addedBy?.name}</span>
                  <span>{req.developerLogs?.length || 0} updates</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 text-white border-slate-800 max-h-[80vh] overflow-y-auto">
          {selectedReq && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-8">
                  <DialogTitle className="text-xl">{selectedReq.title}</DialogTitle>
                  <Badge variant="outline" className={`
                    ${selectedReq.status === 'completed' ? 'border-green-500 text-green-400' : ''}
                    ${selectedReq.status === 'ongoing' ? 'border-blue-500 text-blue-400' : ''}
                    ${selectedReq.status === 'pending' ? 'border-slate-500 text-slate-400' : ''}
                  `}>
                    {selectedReq.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Description</h4>
                  <p className="text-sm bg-slate-950 p-4 rounded-md border border-slate-800 whitespace-pre-wrap">{selectedReq.description}</p>
                </div>

                {isDeveloperOrAdmin && (
                  <form onSubmit={handleUpdate} className="space-y-4 p-4 rounded-md border border-slate-800 bg-slate-950/50">
                    <h4 className="text-sm font-medium text-slate-300">Update Status & Add Log</h4>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(val) => setStatus(val || "")}>
                        <SelectTrigger className="bg-slate-900 border-slate-700">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Work Log Note</Label>
                      <Textarea value={logNote} onChange={e => setLogNote(e.target.value)} placeholder="What did you work on?" className="bg-slate-900 border-slate-700" />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Save Update</Button>
                  </form>
                )}

                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-4">Developer Logs Timeline</h4>
                  <div className="space-y-4">
                    {selectedReq.developerLogs && selectedReq.developerLogs.length > 0 ? (
                      selectedReq.developerLogs.map((log: any, idx: number) => (
                        <div key={idx} className="flex gap-4 p-3 rounded-md bg-slate-950 border border-slate-800">
                          <div className="h-8 w-8 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                            {log.developer?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-slate-200">{log.developer?.name || 'Unknown User'}</span>
                              <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-300 whitespace-pre-wrap">{log.note}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500 text-center py-4">No developer logs yet.</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
