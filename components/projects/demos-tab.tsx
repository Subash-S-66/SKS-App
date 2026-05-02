"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Video, CalendarDays, User, ExternalLink, CheckCircle } from "lucide-react"

export function DemosTab({ project, onUpdate }: { project: any, onUpdate: (p: any) => void }) {
  const { data: session } = useSession()
  const canEdit = session?.user?.role === "admin" || session?.user?.role === "bde"

  const [open, setOpen] = useState(false)

  const [formData, setFormData] = useState({
    demoDate: new Date().toISOString().split('T')[0],
    clientAttended: true,
    demoLink: "",
    recordingLink: "",
    feedback: "",
    outcome: "rescheduled",
    changeRequests: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/projects/${project._id}/demos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            demoDate: new Date(formData.demoDate)
        }),
      })

      if (res.ok) {
        toast.success("Demo recorded successfully")
        const updatedProject = await res.json()
        onUpdate(updatedProject)
        setOpen(false)
        setFormData({
            demoDate: new Date().toISOString().split('T')[0],
            clientAttended: true,
            demoLink: "",
            recordingLink: "",
            feedback: "",
            outcome: "rescheduled",
            changeRequests: ""
        })
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to record demo")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const getOutcomeColor = (outcome: string) => {
      switch(outcome) {
          case 'approved': return "bg-green-500/10 text-green-500 border-green-500/20";
          case 'changes_requested': return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
          case 'rejected': return "bg-red-500/10 text-red-500 border-red-500/20";
          default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Client Demos & Feedback</h3>
        {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]">
                        Record Demo
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-full sm:max-w-[600px]  bg-slate-900 text-white border-slate-800">
                    <DialogHeader>
                        <DialogTitle>Record Demo Session</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto px-1">
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Demo Date</Label>
                                <Input type="date" required value={formData.demoDate} onChange={e => setFormData({...formData, demoDate: e.target.value})} className="bg-slate-950 border-slate-800" />
                            </div>
                            <div className="space-y-2 flex flex-col justify-center">
                                <Label className="mb-2">Attendance</Label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.clientAttended} onChange={e => setFormData({...formData, clientAttended: e.target.checked})} className="rounded bg-slate-950 border-slate-800 w-4 h-4" />
                                    <span className="text-sm">Client Attended</span>
                                </label>
                            </div>
                            <div className="space-y-2">
                                <Label>Meeting Link (Zoom/Teams)</Label>
                                <Input value={formData.demoLink} onChange={e => setFormData({...formData, demoLink: e.target.value})} className="bg-slate-950 border-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Recording Link (Optional)</Label>
                                <Input value={formData.recordingLink} onChange={e => setFormData({...formData, recordingLink: e.target.value})} className="bg-slate-950 border-slate-800" />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Outcome</Label>
                                <Select value={formData.outcome} onValueChange={(val) => setFormData({...formData, outcome: val || ""})}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800"><SelectValue/></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="changes_requested">Changes Requested</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="rescheduled">Rescheduled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>Client Feedback</Label>
                                <Textarea value={formData.feedback} onChange={e => setFormData({...formData, feedback: e.target.value})} className="bg-slate-950 border-slate-800 min-h-[80px]" />
                            </div>
                            {formData.outcome === 'changes_requested' && (
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-yellow-500">Requested Changes</Label>
                                    <Textarea value={formData.changeRequests} onChange={e => setFormData({...formData, changeRequests: e.target.value})} className="bg-slate-950 border-slate-800 border-yellow-500/50 min-h-[80px]" />
                                </div>
                            )}
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px]">Save Demo Record</Button>
                    </form>
                    </div>
                </DialogContent>
            </Dialog>
        )}
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
        {project.demos && project.demos.length > 0 ? (
          project.demos.slice().reverse().map((demo:any, idx:number) => (
            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-800 bg-slate-900 text-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Video className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-800 bg-slate-900/50 shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      {new Date(demo.demoDate).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className={getOutcomeColor(demo.outcome)}>
                      {demo.outcome.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="text-slate-400 text-sm mb-3">
                  <div className="flex items-center gap-1"><User className="w-3 h-3" /> Conducted by: {demo.conductedBy?.name || 'Unknown'}</div>
                  <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className={`w-3 h-3 ${demo.clientAttended ? 'text-green-500' : 'text-slate-600'}`} />
                      Client Attended: {demo.clientAttended ? 'Yes' : 'No'}
                  </div>
                </div>

                {demo.feedback && (
                  <div className="mb-3 bg-slate-950 p-3 rounded-md border border-slate-800 text-sm text-slate-300">
                      <div className="text-xs text-slate-500 mb-1 font-medium">Feedback:</div>
                      {demo.feedback}
                  </div>
                )}

                {demo.changeRequests && (
                  <div className="mb-3 bg-yellow-500/5 p-3 rounded-md border border-yellow-500/20 text-sm text-yellow-500/90">
                      <div className="text-xs text-yellow-600/70 mb-1 font-medium">Requested Changes:</div>
                      {demo.changeRequests}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                    {demo.demoLink && (
                        <a href={demo.demoLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
                            <Video className="w-3 h-3" /> Join Link
                        </a>
                    )}
                    {demo.recordingLink && (
                        <a href={demo.recordingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
                            <ExternalLink className="w-3 h-3" /> Recording
                        </a>
                    )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-8 text-slate-500 relative z-10 bg-slate-950">No demos recorded yet.</div>
        )}
      </div>
    </div>
  )
}
