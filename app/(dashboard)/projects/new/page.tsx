"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewProjectPage() {
  const router = useRouter()
  const [bdes, setBdes] = useState<any[]>([])
  const [developers, setDevelopers] = useState<any[]>([])

  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    typeOfJob: "",
    projectBudget: "",
    startDate: new Date().toISOString().split('T')[0],
    monthForProject: "",
    assignedBDE: "",
    assignedDevelopers: [] as string[],
    customSplit: false,
    sharePercentages: {
      bde: 20,
      developers: [] as number[]
    },
    // New Enhanced Fields
    expectedDeliveryDate: "",
    internalNotes: "",
    isDemoRequired: false,
    links: {
      githubUrl: "",
      finalUrl: ""
    }
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users")
        if (res.ok) {
          const users = await res.json()
          setBdes(users.filter((u: any) => u.role === "bde" || u.role === "admin")) // Admin can also act as BDE for testing
          setDevelopers(users.filter((u: any) => u.role === "developer"))
        }
      } catch (error) {
        toast.error("Failed to load users")
      }
    }
    fetchUsers()
  }, [])

  const handleDeveloperSelect = (devId: string) => {
    setFormData(prev => {
      let newDevs = [...prev.assignedDevelopers]
      if (newDevs.includes(devId)) {
        newDevs = newDevs.filter(id => id !== devId)
      } else {
        if (newDevs.length < 2) {
          newDevs.push(devId)
        } else {
          toast.warning("Maximum 2 developers can be assigned")
          return prev
        }
      }

      let newDevShares: number[] = []
      if (!prev.customSplit) {
        if (newDevs.length === 1) newDevShares = [80]
        else if (newDevs.length === 2) newDevShares = [40, 40]
      } else {
        newDevShares = prev.sharePercentages.developers.slice(0, newDevs.length)
        if (newDevShares.length < newDevs.length) {
            newDevShares.push(0)
        }
      }

      return {
        ...prev,
        assignedDevelopers: newDevs,
        sharePercentages: {
          ...prev.sharePercentages,
          developers: newDevShares
        }
      }
    })
  }

  const handleCustomSplitChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      customSplit: checked,
      sharePercentages: checked ? prev.sharePercentages : {
        bde: 20,
        developers: prev.assignedDevelopers.length === 1 ? [80] : prev.assignedDevelopers.length === 2 ? [40, 40] : []
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const totalShare = formData.sharePercentages.bde + formData.sharePercentages.developers.reduce((a, b) => a + b, 0)
    if (totalShare !== 100 && (formData.assignedBDE || formData.assignedDevelopers.length > 0)) {
        if(formData.assignedBDE && formData.assignedDevelopers.length > 0) {
            toast.error(`Total share percentage must equal 100%. Current total: ${totalShare}%`)
            return
        }
    }

    try {
      const payload: any = {
        ...formData,
        projectBudget: Number(formData.projectBudget),
        startDate: new Date(formData.startDate)
      }

      if (formData.expectedDeliveryDate) {
        payload.expectedDeliveryDate = new Date(formData.expectedDeliveryDate)
      } else {
        delete payload.expectedDeliveryDate
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Project created successfully")
        router.push("/projects")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to create project")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Create New Project</h2>
          <p className="text-muted-foreground text-slate-400 text-sm md:text-base">Add a new project and assign team members.</p>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} required className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="typeOfJob">Type of Job</Label>
                <Input id="typeOfJob" placeholder="e.g. Website, App, SEO" value={formData.typeOfJob} onChange={e => setFormData({...formData, typeOfJob: e.target.value})} required className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectBudget">Total Project Amount (₹)</Label>
                <Input id="projectBudget" type="number" value={formData.projectBudget} onChange={e => setFormData({...formData, projectBudget: e.target.value})} required className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDeliveryDate">Expected Delivery Date (Optional)</Label>
                <Input id="expectedDeliveryDate" type="date" value={formData.expectedDeliveryDate} onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})} className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthForProject">Month for Project</Label>
                <Input id="monthForProject" placeholder="e.g. May 2025" value={formData.monthForProject} onChange={e => setFormData({...formData, monthForProject: e.target.value})} required className="bg-slate-950 border-slate-800" />
              </div>

              <div className="space-y-2 flex flex-col justify-center">
                <Label className="mb-2">Project Features</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDemoRequired"
                    checked={formData.isDemoRequired}
                    onChange={(e) => setFormData({...formData, isDemoRequired: e.target.checked})}
                    className="rounded border-slate-800 bg-slate-900 w-4 h-4"
                  />
                  <Label htmlFor="isDemoRequired" className="text-sm cursor-pointer">Client Demo Required?</Label>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Internal Notes / Description</Label>
                <Textarea
                  value={formData.internalNotes}
                  onChange={e => setFormData({...formData, internalNotes: e.target.value})}
                  placeholder="Admin only internal notes..."
                  className="bg-slate-950 border-slate-800 min-h-[80px]"
                />
              </div>

              <div className="space-y-4 md:col-span-2 border-t border-slate-800 pt-6">
                <h3 className="text-lg font-medium">Quick Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GitHub URL (Optional)</Label>
                    <Input value={formData.links.githubUrl} onChange={e => setFormData({...formData, links: {...formData.links, githubUrl: e.target.value}})} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Final/Live URL (Optional)</Label>
                    <Input value={formData.links.finalUrl} onChange={e => setFormData({...formData, links: {...formData.links, finalUrl: e.target.value}})} className="bg-slate-950 border-slate-800" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2 border-t border-slate-800 pt-6">
                <h3 className="text-lg font-medium">Team Assignment & Shares</h3>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label>Assign BDE</Label>
                    <Select value={formData.assignedBDE} onValueChange={(val) => setFormData({...formData, assignedBDE: val || ""})}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 min-h-[44px]">
                        <SelectValue placeholder="Select BDE" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-white">
                        {bdes.map(bde => (
                          <SelectItem key={bde._id} value={bde._id}>{bde.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Assign Developers (Max 2)</Label>
                    <div className="flex flex-wrap gap-2">
                      {developers.map(dev => (
                        <Button
                          key={dev._id}
                          type="button"
                          variant={formData.assignedDevelopers.includes(dev._id) ? "default" : "outline"}
                          className={`text-sm min-h-[44px] ${formData.assignedDevelopers.includes(dev._id) ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                          onClick={() => handleDeveloperSelect(dev._id)}
                        >
                          {dev.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-slate-950 border border-slate-800 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold text-slate-200">Revenue Split</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="customSplit"
                        checked={formData.customSplit}
                        onChange={(e) => handleCustomSplitChange(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 w-4 h-4"
                      />
                      <Label htmlFor="customSplit" className="text-sm text-slate-400 font-normal cursor-pointer">Custom Split</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {formData.assignedBDE && (
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">BDE Share (%)</Label>
                        <Input
                          type="number"
                          disabled={!formData.customSplit}
                          value={formData.sharePercentages.bde}
                          onChange={(e) => setFormData({
                            ...formData,
                            sharePercentages: { ...formData.sharePercentages, bde: Number(e.target.value) }
                          })}
                          className="bg-slate-900 border-slate-800 h-10"
                        />
                      </div>
                    )}

                    {formData.assignedDevelopers.map((devId: any, index: number) => {
                      const dev = developers.find(d => d._id === devId)
                      return (
                        <div key={devId} className="space-y-1">
                          <Label className="text-xs text-slate-400">Dev Share: {dev?.name.split(' ')[0]} (%)</Label>
                          <Input
                            type="number"
                            disabled={!formData.customSplit}
                            value={formData.sharePercentages.developers[index] || 0}
                            onChange={(e) => {
                              const newShares = [...formData.sharePercentages.developers]
                              newShares[index] = Number(e.target.value)
                              setFormData({
                                ...formData,
                                sharePercentages: { ...formData.sharePercentages, developers: newShares }
                              })
                            }}
                            className="bg-slate-900 border-slate-800 h-10"
                          />
                        </div>
                      )
                    })}
                  </div>

                  {formData.customSplit && (formData.assignedBDE || formData.assignedDevelopers.length > 0) && (
                    <div className="mt-4 text-xs font-medium">
                      Total: <span className={
                        (formData.sharePercentages.bde + formData.sharePercentages.developers.reduce((a, b) => a + b, 0)) === 100
                        ? "text-green-500" : "text-red-500"
                      }>
                        {formData.sharePercentages.bde + formData.sharePercentages.developers.reduce((a, b) => a + b, 0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 min-h-[44px] w-full md:w-auto">Create Project</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
