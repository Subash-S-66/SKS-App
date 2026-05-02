"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/Card";
import { format } from "date-fns";

export default function ActivityTab({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/activity${filter !== "all" ? `?type=${filter}` : ""}`);
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [projectId, filter]);

  const getTypeIcon = (type: string) => {
    switch(type) {
        case 'requirement': return '📝';
        case 'payment': return '💰';
        case 'demo': return '🖥️';
        case 'status': return '🔄';
        case 'credential': return '🔑';
        case 'link': return '🔗';
        default: return '📍';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-semibold">Activity Timeline</h3>
        <select
          className="h-9 rounded-md border border-border bg-background px-3 py-1 text-sm"
          value={filter} onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Activities</option>
          <option value="status">Status & Updates</option>
          <option value="requirement">Requirements & Logs</option>
          <option value="payment">Payments</option>
          <option value="demo">Demos</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No activity recorded yet.</CardContent>
        </Card>
      ) : (
        <div className="relative border-l border-border ml-4 space-y-8 pb-4">
          {activities.map((act: any, i: number) => (
            <div key={i} className="relative pl-6">
              <div className="absolute w-8 h-8 bg-secondary rounded-full -left-4 top-0 border border-border flex items-center justify-center text-xs">
                {getTypeIcon(act.type)}
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{act.userId?.name || "System"}</span>
                    <span className="text-xs text-muted-foreground">• {format(new Date(act.createdAt), "MMM dd, hh:mm a")}</span>
                </div>
                <p className="text-sm text-foreground">{act.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
