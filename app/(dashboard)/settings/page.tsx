"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { FileText } from "lucide-react"

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Password changed successfully")
        setCurrentPassword("")
        setNewPassword("")
      } else {
        toast.error(data.error || "Failed to change password")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-slate-400">Manage your account settings and application preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription className="text-slate-400">Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader>
            <CardTitle>Administration</CardTitle>
            <CardDescription className="text-slate-400">Manage system-wide settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/settings/audit-logs">
              <Button variant="outline" className="w-full justify-start border-slate-800 bg-slate-950 hover:bg-slate-800 hover:text-white">
                <FileText className="mr-2 h-4 w-4" />
                View Audit Logs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
