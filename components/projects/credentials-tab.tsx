"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Eye, EyeOff, Server, Mail, Globe, Key } from "lucide-react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function CredentialsTab({ projectId }: { projectId: string }) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  const [credentials, setCredentials] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState<Record<string, string>>({})

  // Form State (Admin Only)
  const [openEdit, setOpenEdit] = useState(false)
  const [formData, setFormData] = useState<any>({
    gmailCreated: "",
    gmailPassword: "",
    hostingProvider: "",
    hostingUsername: "",
    hostingPassword: "",
    hostingStartDate: "",
    hostingFreeDays: "",
    customDomain: false,
    customDomainName: "",
    otherCredentials: []
  })

  const fetchCredentials = async () => {
    try {
      const res = await fetch(`/api/credentials?projectId=${projectId}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setCredentials(data)
          // Pre-fill form if admin opens edit mode
          setFormData({
            ...data,
            hostingStartDate: data.hostingStartDate ? new Date(data.hostingStartDate).toISOString().split('T')[0] : "",
            gmailPassword: "", // Don't pre-fill masked passwords in form
            hostingPassword: "",
            otherCredentials: data.otherCredentials.map((c:any) => ({...c, password: ""}))
          })
        }
      }
    } catch (error) {
      toast.error("Failed to load credentials")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredentials()
  }, [projectId])

  const handleReveal = async (field: string, otherIndex?: number) => {
    const key = otherIndex !== undefined ? `${field}_${otherIndex}` : field

    if (revealed[key]) {
      // Hide if already revealed
      setRevealed(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      return
    }

    try {
      const res = await fetch("/api/credentials/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, field, otherIndex }),
      })

      if (res.ok) {
        const data = await res.json()
        setRevealed(prev => ({ ...prev, [key]: data.password }))
        toast.success("Credential revealed and logged")
      } else {
        toast.error("Failed to reveal credential")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, projectId }),
      })
      if (res.ok) {
        toast.success("Credentials saved")
        setOpenEdit(false)
        fetchCredentials()
      } else {
        toast.error("Failed to save credentials")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const calculateDaysLeft = (expiryDate: string) => {
    if (!expiryDate) return null
    const diff = new Date(expiryDate).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 3600 * 24))
    return days
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Access & Credentials</h3>
        {isAdmin && (
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>


              <Button onClick={() => setOpenEdit(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                {credentials ? "Edit Credentials" : "Add Credentials"}
              </Button>


            <DialogContent className="w-full w-[95vw] max-w-[95vw] sm:w-full sm:max-w-[700px] mx-auto w-11/12 bg-slate-900 text-white border-slate-800 ">
              <DialogHeader>
                <DialogTitle>{credentials ? "Edit" : "Add"} Project Credentials</DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto px-1">
              <form onSubmit={handleSave} className="space-y-6 pt-4">
                {/* Form fields for Admin */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><h4 className="font-medium text-slate-300 border-b border-slate-800 pb-2">Google Account</h4></div>
                  <div className="space-y-2">
                    <Label>Gmail Address</Label>
                    <Input value={formData.gmailCreated} onChange={e => setFormData({...formData, gmailCreated: e.target.value})} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password (leave blank to keep existing)</Label>
                    <Input type="password" value={formData.gmailPassword} onChange={e => setFormData({...formData, gmailPassword: e.target.value})} className="bg-slate-950 border-slate-800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><h4 className="font-medium text-slate-300 border-b border-slate-800 pb-2">Hosting & Domain</h4></div>
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Input value={formData.hostingProvider} onChange={e => setFormData({...formData, hostingProvider: e.target.value})} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hosting Username</Label>
                    <Input value={formData.hostingUsername} onChange={e => setFormData({...formData, hostingUsername: e.target.value})} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hosting Password</Label>
                    <Input type="password" value={formData.hostingPassword} onChange={e => setFormData({...formData, hostingPassword: e.target.value})} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={formData.hostingStartDate} onChange={e => setFormData({...formData, hostingStartDate: e.target.value})} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Free Days Given</Label>
                    <Input type="number" value={formData.hostingFreeDays} onChange={e => setFormData({...formData, hostingFreeDays: Number(e.target.value)})} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2 flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.customDomain} onChange={e => setFormData({...formData, customDomain: e.target.checked})} className="rounded bg-slate-950 border-slate-800" />
                      <span className="text-sm font-medium">Custom Domain Setup</span>
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Save Credentials</Button>
              </form>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!credentials ? (
        <div className="text-slate-400 p-8 text-center border border-dashed border-slate-800 rounded-lg">
          No credentials have been securely stored for this project yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Gmail Card */}
          {credentials.gmailCreated && (
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Mail className="h-5 w-5 text-red-500" /> Google Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Email Address</div>
                  <div className="font-mono bg-slate-950 p-2 rounded border border-slate-800">{credentials.gmailCreated}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Password</div>
                  <div className="flex gap-2">
                    <Input readOnly type={revealed.gmailPassword ? "text" : "password"} value={revealed.gmailPassword || credentials.gmailPassword} className="font-mono bg-slate-950 border-slate-800" />
                    <Button variant="outline" size="icon" onClick={() => handleReveal('gmailPassword')} className="shrink-0 border-slate-800 bg-slate-950 hover:bg-slate-800 hover:text-white">
                      {revealed.gmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hosting Card */}
          {credentials.hostingProvider && (
            <Card className="bg-slate-900 border-slate-800 text-white md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2"><Server className="h-5 w-5 text-blue-500" /> Hosting Account</div>
                  {credentials.customDomain && <Globe className="h-5 w-5 text-emerald-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Provider</div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">{credentials.hostingProvider}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Username</div>
                    <div className="font-mono bg-slate-950 p-2 rounded border border-slate-800">{credentials.hostingUsername}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-slate-400 mb-1">Password</div>
                  <div className="flex gap-2">
                    <Input readOnly type={revealed.hostingPassword ? "text" : "password"} value={revealed.hostingPassword || credentials.hostingPassword} className="font-mono bg-slate-950 border-slate-800" />
                    <Button variant="outline" size="icon" onClick={() => handleReveal('hostingPassword')} className="shrink-0 border-slate-800 bg-slate-950 hover:bg-slate-800 hover:text-white">
                      {revealed.hostingPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {credentials.hostingExpiryDate && (
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">Expiry: {new Date(credentials.hostingExpiryDate).toLocaleDateString()}</div>
                      {(() => {
                        const days = calculateDaysLeft(credentials.hostingExpiryDate)
                        if (days === null) return null
                        const colorClass = days > 30 ? "text-green-500 bg-green-500/10 border-green-500/20" : days > 10 ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"
                        return (
                          <div className={`px-2 py-1 rounded border text-xs font-bold ${colorClass}`}>
                            {days} days left
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
