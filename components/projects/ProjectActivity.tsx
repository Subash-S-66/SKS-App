"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { History, Activity, AlertCircle, FileText, CheckCircle2, DollarSign, Users, User, Link as LinkIcon, MessageSquare, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProjectActivity({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/projects/${projectId}/activity?type=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [projectId, filter]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'requirement': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'status': return <Activity className="w-4 h-4 text-green-500" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case 'demo': return <Video className="w-4 h-4 text-purple-500" />;
      case 'credential': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'link': return <LinkIcon className="w-4 h-4 text-indigo-500" />;
      case 'email': return <MessageSquare className="w-4 h-4 text-slate-500" />;
      default: return <History className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold flex items-center"><History className="w-5 h-5 mr-2" /> Project Timeline</h3>

        <Select value={filter} onValueChange={(v) => { if(v) setFilter(v) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="requirement">Requirements & Tasks</SelectItem>
            <SelectItem value="payment">Payments & Finances</SelectItem>
            <SelectItem value="demo">Demos & Meetings</SelectItem>
            <SelectItem value="status">Status Changes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading timeline...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 border-dashed border-2 rounded-lg m-4 sm:m-0 text-slate-500">
              <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No activity logged yet.</p>
            </div>
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-6 md:ml-8 space-y-8 py-4">
              {logs.map((log) => (
                <div key={log._id} className="relative pl-6 md:pl-8 group">
                  <div className="absolute -left-3 md:-left-4 top-1 bg-white dark:bg-slate-950 rounded-full border border-slate-200 dark:border-slate-800 p-1 md:p-1.5 shadow-sm group-hover:scale-110 transition-transform">
                    {getIconForType(log.type)}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800/50 shadow-sm mr-4 sm:mr-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm flex items-center">
                          <User className="w-3 h-3 mr-1 text-slate-400" />
                          {log.userId?.name || 'System'}
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase tracking-wider">{log.type}</Badge>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {format(new Date(log.createdAt), 'MMM dd, h:mm a')}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {log.action}
                    </p>

                    {/* Metadata rendering if exists */}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-3 text-xs bg-white dark:bg-slate-950 p-2 rounded border font-mono text-slate-500 overflow-x-auto">
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-semibold">{key}:</span>
                            <span>{JSON.stringify(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}