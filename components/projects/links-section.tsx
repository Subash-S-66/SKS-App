"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { Link2, Globe, HardDrive, Copy, ExternalLink, Plus, Trash2, LayoutDashboard } from "lucide-react"

export function LinksSection({ project, onUpdate }: { project: any, onUpdate: (p: any) => void }) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState(project.links || {
      finalUrl: "", stagingUrl: "", hostedUrl: "", githubUrl: "", figmaUrl: "", driveUrl: "", adminUrl: "", otherLinks: []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/projects/${project._id}/links`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      })

      if (res.ok) {
        toast.success("Project links updated")
        const updatedProject = await res.json()
        onUpdate(updatedProject)
        setOpen(false)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update links")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleCopy = (url: string) => {
      navigator.clipboard.writeText(url);
      toast.success("Copied to clipboard");
  }

  const predefinedLinks = [
      { key: 'finalUrl', label: 'Live Production URL', icon: Globe, color: 'text-green-500', bg: 'bg-green-500/10' },
      { key: 'stagingUrl', label: 'Staging / Test URL', icon: Link2, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
      { key: 'adminUrl', label: 'Admin / CMS Panel', icon: LayoutDashboard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      { key: 'githubUrl', label: 'GitHub Repository', icon: Link2, color: 'text-slate-300', bg: 'bg-slate-800' },
      { key: 'figmaUrl', label: 'Figma Design', icon: Link2, color: 'text-pink-500', bg: 'bg-pink-500/10' },
      { key: 'driveUrl', label: 'Google Drive Assets', icon: HardDrive, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { key: 'hostedUrl', label: 'Hosting Control Panel', icon: Globe, color: 'text-orange-500', bg: 'bg-orange-500/10' }
  ]

  const hasAnyLink = predefinedLinks.some(l => project.links?.[l.key]) || (project.links?.otherLinks?.length > 0)

  return (
    <div className="space-y-6 mt-8">
      <div className="flex justify-between items-center border-t border-slate-800 pt-8">
        <h3 className="text-lg font-medium">Project Links & Resources</h3>
        {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger>
                    <Button variant="outline" className="border-slate-700 text-white bg-slate-900 hover:bg-slate-800 min-h-[44px]">
                        Manage Links
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-full sm:max-w-[600px]  bg-slate-900 text-white border-slate-800">
                    <DialogHeader>
                        <DialogTitle>Project Links</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto px-1">
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {predefinedLinks.map(link => (
                                <div key={link.key} className="space-y-2">
                                    <Label className="flex items-center gap-2"><link.icon className={`w-4 h-4 ${link.color}`} /> {link.label}</Label>
                                    <Input value={links[link.key] || ''} onChange={e => setLinks({...links, [link.key]: e.target.value})} placeholder="https://" className="bg-slate-950 border-slate-800" />
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <div className="flex justify-between items-center mb-4">
                                <Label>Other Links</Label>
                                <Button type="button" variant="outline" size="sm" className="bg-slate-950 border-slate-700" onClick={() => setLinks({...links, otherLinks: [...(links.otherLinks || []), {label: '', url: ''}]})}>
                                    <Plus className="w-4 h-4 mr-1" /> Add Link
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {links.otherLinks?.map((ol:any, i:number) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <div className="flex-1 space-y-2">
                                            <Input placeholder="Label (e.g. Trello)" value={ol.label} onChange={e => {
                                                const newOthers = [...links.otherLinks];
                                                newOthers[i].label = e.target.value;
                                                setLinks({...links, otherLinks: newOthers});
                                            }} className="bg-slate-950 border-slate-800" />
                                            <Input placeholder="URL" value={ol.url} onChange={e => {
                                                const newOthers = [...links.otherLinks];
                                                newOthers[i].url = e.target.value;
                                                setLinks({...links, otherLinks: newOthers});
                                            }} className="bg-slate-950 border-slate-800" />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => {
                                            const newOthers = [...links.otherLinks];
                                            newOthers.splice(i, 1);
                                            setLinks({...links, otherLinks: newOthers});
                                        }}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px]">Save Links</Button>
                    </form>
                    </div>
                </DialogContent>
            </Dialog>
        )}
      </div>

      {hasAnyLink ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {predefinedLinks.map(link => {
                const url = project.links?.[link.key];
                if (!url) return null;
                return (
                    <Card key={link.key} className="bg-slate-900 border-slate-800 text-white">
                        <CardContent className="p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${link.bg} ${link.color}`}>
                                    <link.icon className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-medium text-sm text-slate-200 truncate">{link.label}</div>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block w-full max-w-[150px] sm:max-w-[200px]">
                                        {url.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleCopy(url)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            {project.links?.otherLinks?.map((ol:any, i:number) => {
                if (!ol.url) return null;
                return (
                    <Card key={i} className="bg-slate-900 border-slate-800 text-white">
                        <CardContent className="p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-slate-800 text-slate-300">
                                    <Link2 className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-medium text-sm text-slate-200 truncate">{ol.label || 'Other Link'}</div>
                                    <a href={ol.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block w-full max-w-[150px] sm:max-w-[200px]">
                                        {ol.url.replace(/^https?:\/\//, '')}
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => handleCopy(ol.url)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <a href={ol.url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                        <ExternalLink className="w-4 h-4" />
                                    </Button>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
      ) : (
          <div className="text-center p-8 text-slate-500 border border-slate-800 border-dashed rounded-lg">No links added to this project yet.</div>
      )}
    </div>
  )
}
