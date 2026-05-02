"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ListChecks, Banknote, Video, Activity, Link2, Key, Users, Mail, Settings } from "lucide-react"

export function ActivityTab({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/activity`)
        if (res.ok) {
          const data = await res.json()
          setLogs(data)
        }
      } catch (error) {
        toast.error("Failed to load activity logs")
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [projectId])

  const filteredLogs = filter === "all" ? logs : logs.filter(log => log.type === filter)

  const getIconForType = (type: string) => {
    switch (type) {
      case 'requirement': return <ListChecks className="w-4 h-4 text-blue-500" />
      case 'payment': return <Banknote className="w-4 h-4 text-green-500" />
      case 'demo': return <Video className="w-4 h-4 text-purple-500" />
      case 'status': return <Activity className="w-4 h-4 text-yellow-500" />
      case 'link': return <Link2 className="w-4 h-4 text-pink-500" />
      case 'credential': return <Key className="w-4 h-4 text-orange-500" />
      case 'team': return <Users className="w-4 h-4 text-indigo-500" />
      case 'email': return <Mail className="w-4 h-4 text-slate-400" />
      default: return <Settings className="w-4 h-4 text-slate-500" />
    }
  }

  const getBgForType = (type: string) => {
    switch (type) {
      case 'requirement': return "bg-blue-500/10"
      case 'payment': return "bg-green-500/10"
      case 'demo': return "bg-purple-500/10"
      case 'status': return "bg-yellow-500/10"
      case 'link': return "bg-pink-500/10"
      case 'credential': return "bg-orange-500/10"
      case 'team': return "bg-indigo-500/10"
      case 'email': return "bg-slate-500/10"
      default: return "bg-slate-800"
    }
  }

  const filters = [
    { id: 'all', label: 'All Activity' },
    { id: 'requirement', label: 'Requirements' },
    { id: 'payment', label: 'Payments' },
    { id: 'demo', label: 'Demos' },
    { id: 'status', label: 'Status' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Activity Log</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f.id ? 'bg-blue-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-800 text-white">
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="text-center p-8 text-slate-400">Loading activity timeline...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center p-8 text-slate-500">No activity recorded for this filter.</div>
          ) : (
            <div className="relative border-l border-slate-800 ml-4 sm:ml-6 mt-4 mb-4 space-y-8">
              {filteredLogs.map((log) => (
                <div key={log._id} className="relative pl-6 sm:pl-8">
                  <div className={`absolute -left-4 w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center ${getBgForType(log.type)}`}>
                    {getIconForType(log.type)}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    <div className="font-medium text-slate-200">
                        {log.action}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 text-xs flex items-center justify-center text-slate-400">
                        {log.userId?.name?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs text-slate-400">by {log.userId?.name || 'System'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
