"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Label } from "@/components/ui/Label";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";

export default function TeamTab({ project }: { project: any }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const [assignedBDE, setAssignedBDE] = useState(project.assignedBDE?._id || "");
  const [assignedDevelopers, setAssignedDevelopers] = useState<string[]>(
    project.assignedDevelopers?.map((d: any) => d._id) || []
  );

  useEffect(() => {
    if (role === "admin") {
      fetch("/api/users")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUsers(data);
        });
    }
  }, [role]);

  const bdes = users.filter(u => u.role === "bde");
  const devs = users.filter(u => u.role === "developer");

  const handleDevChange = (devId: string) => {
    setAssignedDevelopers(prev => {
      if (prev.includes(devId)) {
        return prev.filter(id => id !== devId);
      } else {
        if (prev.length >= 2) {
          toast.error("Maximum 2 developers can be assigned");
          return prev;
        }
        return [...prev, devId];
      }
    });
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedBDE: assignedBDE || null,
          assignedDevelopers,
        }),
      });

      if (res.ok) {
        toast.success("Team reassigned successfully");
        setIsEditOpen(false);
        window.location.reload();
      } else {
        toast.error("Failed to update team");
      }
    } catch {
      toast.error("Error updating team");
    }
  };

  const bde = project.assignedBDE;
  const devList = project.assignedDevelopers || [];

  const bdeShare = project.sharePercentages?.bde || 20;
  const devShares = project.sharePercentages?.developers || [];

  const UserCard = ({ user, roleLabel, sharePercentage, colorClass }: any) => {
    if (!user) {
      return (
        <Card className="bg-secondary/50 border-dashed">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[160px]">
            <p className="text-muted-foreground text-sm font-medium">No {roleLabel} Assigned</p>
            <p className="text-xs text-muted-foreground mt-1">Share unallocated ({sharePercentage}%)</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-6 flex items-start gap-4">
          <div className={`h-12 w-12 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">{user.name}</h4>
            <p className="text-xs text-muted-foreground mb-3">{user.email}</p>
            <div className="flex justify-between items-center text-sm">
              <span className="bg-background px-2 py-1 rounded text-xs border border-border">Role: {roleLabel}</span>
              <span className="font-semibold text-primary">{sharePercentage}% Share</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Team Assignment</h3>
        {role === "admin" && (
          <Button size="sm" variant="outline" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Reassign Team
          </Button>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Business Development</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <UserCard user={bde} roleLabel="BDE" sharePercentage={bdeShare} colorClass="bg-primary" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Development Team</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {devList.length === 0 ? (
            <UserCard user={null} roleLabel="Developer" sharePercentage={80} />
          ) : (
            devList.map((dev: any, i: number) => (
              <UserCard
                key={dev._id}
                user={dev}
                roleLabel="Developer"
                sharePercentage={devShares[i] || 0}
                colorClass="bg-info"
              />
            ))
          )}
        </div>
      </div>

      <Card className="bg-secondary border-border overflow-hidden">
        <div className="p-6">
          <h4 className="font-semibold mb-4 text-center">Revenue Distribution</h4>
          <div className="flex w-full h-8 rounded-full overflow-hidden text-xs font-bold text-white text-center leading-8 shadow-inner">
            <div style={{ width: `${bdeShare}%`, backgroundColor: "var(--primary)" }} title={`BDE: ${bdeShare}%`}>
              BDE {bdeShare}%
            </div>

            {devList.length === 0 ? (
              <div style={{ width: "80%", backgroundColor: "var(--border)", color: "var(--muted-foreground)" }} title="Unallocated: 80%">
                Unallocated 80%
              </div>
            ) : (
              devList.map((dev: any, i: number) => (
                <div
                  key={dev._id}
                  style={{ width: `${devShares[i]}%`, backgroundColor: i === 0 ? "var(--info)" : "var(--success)" }}
                  title={`${dev.name}: ${devShares[i]}%`}
                >
                  Dev {i + 1} {devShares[i]}%
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Reassign Team">
        <form onSubmit={handleSaveTeam} className="space-y-6">
          <div className="space-y-2">
            <Label>Assign BDE</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={assignedBDE}
              onChange={e => setAssignedBDE(e.target.value)}
            >
              <option value="">No BDE</option>
              {bdes.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="flex justify-between">
              <span>Assign Developers (Max 2)</span>
              <span className="text-muted-foreground text-xs">{assignedDevelopers.length}/2 selected</span>
            </Label>
            <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-border rounded-md">
              {devs.map(dev => (
                <label key={dev._id} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-white/5 rounded">
                  <input
                    type="checkbox"
                    className="rounded border-border bg-background text-primary"
                    checked={assignedDevelopers.includes(dev._id)}
                    onChange={() => handleDevChange(dev._id)}
                  />
                  <span className="text-sm">{dev.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Note: Reassigning developers will automatically recalculate shares (1 Dev = 80%, 2 Devs = 40% each).</p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit">Save Reassignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
