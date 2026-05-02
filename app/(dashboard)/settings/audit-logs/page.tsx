"use client"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/audit-logs")
        if (res.ok) {
          const data = await res.json()
          setLogs(data)
        }
      } catch (error) {
        toast.error("Failed to load audit logs")
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase())

    const logDate = new Date(log.createdAt).toISOString().split('T')[0]
    const matchesDate = dateFilter ? logDate === dateFilter : true

    return matchesSearch && matchesDate
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground text-slate-400">Security history and credential access logs.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Search logs..."
            className="pl-9 bg-slate-900 border-slate-800 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full sm:max-w-xs">
          <Input
            type="date"
            className="bg-slate-900 border-slate-800 text-slate-300"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        {(searchTerm || dateFilter) && (
          <Button variant="ghost" className="text-slate-400" onClick={() => { setSearchTerm(""); setDateFilter(""); }}>
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Time</TableHead>
              <TableHead className="text-slate-400">User</TableHead>
              <TableHead className="text-slate-400">Action</TableHead>
              <TableHead className="text-slate-400">Details</TableHead>
              <TableHead className="text-slate-400">IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-slate-400">Loading logs...</TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-slate-400">No logs found.</TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log._id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="text-slate-300">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {log.user?.name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-slate-300 font-mono text-sm">{log.action}</TableCell>
                  <TableCell className="text-slate-400">{log.details}</TableCell>
                  <TableCell className="text-slate-400">{log.ipAddress || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
