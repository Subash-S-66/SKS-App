"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export function TeamTab({ project, onUpdate }: { project: any, onUpdate: (p: any) => void }) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const [bdes, setBdes] = useState<any[]>([])
  const [developers, setDevelopers] = useState<any[]>([])

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    assignedBDE: project.assignedBDE?._id || "",
    assignedDevelopers: project.assignedDevelopers?.map((d:any) => d._id) || [],
    customSplit: project.customSplit || false,
    sharePercentages: project.sharePercentages || { bde: 20, developers: [] }
  })

  useEffect(() => {
    if (isAdmin && bdes.length === 0) {
      const fetchUsers = async () => {
        try {
          const res = await fetch("/api/users")
          if (res.ok) {
            const users = await res.json()
            setBdes(users.filter((u: any) => u.role === "bde" || u.role === "admin"))
            setDevelopers(users.filter((u: any) => u.role === "developer"))
          }
        } catch (error) {
          toast.error("Failed to load users")
        }
      }
      fetchUsers()
    }
  }, [isAdmin])

  useEffect(() => {
    // Reset form when project updates or edit mode toggles
    setFormData({
      assignedBDE: project.assignedBDE?._id || "",
      assignedDevelopers: project.assignedDevelopers?.map((d:any) => d._id) || [],
      customSplit: project.customSplit || false,
      sharePercentages: project.sharePercentages || { bde: 20, developers: [] }
    })
  }, [project, isEditing])

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

      let newDevShares = []
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

  const handleSave = async () => {
    const totalShare = formData.sharePercentages.bde + formData.sharePercentages.developers.reduce((a:any, b:any) => a + b, 0)
    if (totalShare !== 100 && (formData.assignedBDE || formData.assignedDevelopers.length > 0)) {
        if(formData.assignedBDE && formData.assignedDevelopers.length > 0) {
            toast.error(`Total share percentage must equal 100%. Current total: ${totalShare}%`)
            return
        }
    }

    try {
      const res = await fetch(`/api/projects/${project._id}/team`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success("Team & Shares updated")
        const updatedProject = await res.json()
        onUpdate(updatedProject)
        setIsEditing(false)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update team")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Team & Revenue Shares</h3>
        {isAdmin && !isEditing && (
          <Button onClick={() => setIsEditing(true)} className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700">
            Edit Team / Shares
          </Button>
        )}
        {isAdmin && isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="border-slate-800 bg-slate-950 text-slate-300">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Business Development</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Assign BDE</Label>
                  <Select value={formData.assignedBDE} onValueChange={(val) => setFormData({...formData, assignedBDE: val || ""})}>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Select BDE (Optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="none">None</SelectItem>
                      {bdes.map(bde => (
                        <SelectItem key={bde._id} value={bde._id}>{bde.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.assignedBDE && formData.assignedBDE !== "none" && (
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
                      className="bg-slate-950 border-slate-800 h-8 w-24"
                    />
                  </div>
                )}
              </div>
            ) : project.assignedBDE ? (
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-900/50 text-purple-400 rounded-full flex items-center justify-center font-bold">
                    {project.assignedBDE.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{project.assignedBDE.name}</div>
                    <div className="text-xs text-slate-400 capitalize">{project.assignedBDE.role}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                  {project.sharePercentages?.bde || 0}% Share
                </Badge>
              </div>
            ) : (
              <div className="text-slate-400">No BDE assigned.</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Development Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Assign Developers (Max 2)</Label>
                  <div className="flex flex-wrap gap-2">
                    {developers.map(dev => (
                      <Button
                        key={dev._id}
                        type="button"
                        variant={formData.assignedDevelopers.includes(dev._id) ? "default" : "outline"}
                        className={`text-sm ${formData.assignedDevelopers.includes(dev._id) ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                        onClick={() => handleDeveloperSelect(dev._id)}
                      >
                        {dev.name}
                      </Button>
                    ))}
                  </div>
                </div>
                {formData.assignedDevelopers.map((devId: any, index: number) => {
                  const dev = developers.find(d => d._id === devId) || project.assignedDevelopers.find((d:any) => d._id === devId)
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
                        className="bg-slate-950 border-slate-800 h-8 w-24"
                      />
                    </div>
                  )
                })}
              </div>
            ) : project.assignedDevelopers && project.assignedDevelopers.length > 0 ? (
              project.assignedDevelopers.map((dev: any, idx: number) => (
                <div key={dev._id} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-900/50 text-blue-400 rounded-full flex items-center justify-center font-bold">
                      {dev.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{dev.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{dev.role}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                    {project.sharePercentages?.developers?.[idx] || 0}% Share
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-slate-400">No Developers assigned.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {isEditing && (
        <div className="p-4 rounded-md bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-semibold text-slate-200">Revenue Split Configuration</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="customSplit"
                checked={formData.customSplit}
                onChange={(e) => handleCustomSplitChange(e.target.checked)}
                className="rounded border-slate-800 bg-slate-900"
              />
              <Label htmlFor="customSplit" className="text-sm text-slate-400 font-normal cursor-pointer">Enable Custom Split Override</Label>
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-4">By default, splits are auto-calculated (BDE 20%, Dev 80% or 40/40%). Check the box above to manually override these percentages in the team cards.</p>

          {formData.customSplit && (formData.assignedBDE || formData.assignedDevelopers.length > 0) && (
            <div className="text-sm font-medium">
              Total Validation: <span className={
                (formData.sharePercentages.bde + formData.sharePercentages.developers.reduce((a:any, b:any) => a + b, 0)) === 100
                ? "text-green-500" : "text-red-500"
              }>
                {formData.sharePercentages.bde + formData.sharePercentages.developers.reduce((a:any, b:any) => a + b, 0)}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
