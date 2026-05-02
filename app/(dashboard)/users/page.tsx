"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Copy, RefreshCw } from "lucide-react"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("developer")
  const [generatedPassword, setGeneratedPassword] = useState("")

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let pass = ""
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pass)
    setGeneratedPassword(pass)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password, role, needsPasswordChange: true }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("User created successfully")
        if (generatedPassword) {
            toast.message("User Password", {
                description: `Password: ${generatedPassword} (Copied to clipboard)`,
                duration: 10000,
            })
            navigator.clipboard.writeText(generatedPassword)
        }
        setOpen(false)
        fetchUsers()
        // Reset form
        setName("")
        setUsername("")
        setEmail("")
        setPassword("")
        setRole("developer")
        setGeneratedPassword("")
      } else {
        toast.error(data.error || "Failed to create user")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground text-slate-400">Manage team members and their roles.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]">Add User</Button>
          </DialogTrigger>
          <DialogContent className="w-full sm:max-w-[425px] bg-slate-900 text-white border-slate-800">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto px-1">
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-slate-950 border-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <div className="flex gap-2">
                    <Input id="password" type="text" value={password} onChange={e => { setPassword(e.target.value); setGeneratedPassword(""); }} required className="bg-slate-950 border-slate-800" />
                    <Button type="button" variant="outline" size="icon" onClick={generatePassword} className="shrink-0 bg-slate-950 border-slate-800 text-slate-400 hover:text-white" title="Generate Random Password">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                </div>
                <p className="text-xs text-slate-500">Users will be forced to change this on their first login.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(val) => setRole(val || "")}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 min-h-[44px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="bde">BDE</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px]">Create User</Button>
            </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400 min-w-[150px]">Name</TableHead>
              <TableHead className="text-slate-400">Username</TableHead>
              <TableHead className="text-slate-400">Email</TableHead>
              <TableHead className="text-slate-400">Role</TableHead>
              <TableHead className="text-slate-400">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-slate-400">Loading users...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-slate-400">No users found.</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-white">{user.name}</TableCell>
                  <TableCell className="text-slate-300">{user.username}</TableCell>
                  <TableCell className="text-slate-300">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      ${user.role === 'admin' ? 'border-red-500 text-red-400' : ''}
                      ${user.role === 'bde' ? 'border-purple-500 text-purple-400' : ''}
                      ${user.role === 'developer' ? 'border-blue-500 text-blue-400' : ''}
                    `}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
