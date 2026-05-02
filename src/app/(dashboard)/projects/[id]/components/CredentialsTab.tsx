"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Eye, Plus, ShieldAlert, Pencil, Trash2, ExternalLink, Link as LinkIcon } from "lucide-react";
import toast from "react-hot-toast";

export default function CredentialsTab({ projectId, project, refreshProject }: { projectId: string, project: any, refreshProject: () => void }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinksOpen, setIsLinksOpen] = useState(false);
  const [selectedCredId, setSelectedCredId] = useState("");

  const [type, setType] = useState("gmail");
  const [formData, setFormData] = useState({
    label: "", username: "", password: "", provider: "", startDate: "", freeDays: "0", customDomain: false, domainName: "",
  });

  const [linksData, setLinksData] = useState({
    finalUrl: project.links?.finalUrl || "",
    stagingUrl: project.links?.stagingUrl || "",
    hostedUrl: project.links?.hostedUrl || "",
    githubUrl: project.links?.githubUrl || "",
    figmaUrl: project.links?.figmaUrl || "",
    driveUrl: project.links?.driveUrl || "",
    adminUrl: project.links?.adminUrl || "",
  });

  useEffect(() => {
    fetchCredentials();
  }, [projectId]);

  const fetchCredentials = async () => {
    try {
      const res = await fetch(`/api/credentials?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const revealPassword = async (id: string) => {
    if (revealedPasswords[id]) {
      const newRevealed = { ...revealedPasswords };
      delete newRevealed[id];
      setRevealedPasswords(newRevealed);
      return;
    }

    try {
      const res = await fetch(`/api/credentials/${id}/reveal`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setRevealedPasswords({ ...revealedPasswords, [id]: data.password });
        toast.success("Access logged");
      } else {
        toast.error("Failed to reveal password");
      }
    } catch {
      toast.error("Error revealing password");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type, ...formData, freeDays: Number(formData.freeDays) }),
      });
      if (res.ok) {
        toast.success("Credential added securely");
        setIsAddOpen(false);
        resetForm();
        fetchCredentials();
      } else {
        toast.error("Failed to add credential");
      }
    } catch {
      toast.error("Error adding credential");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bodyPayload = { type, ...formData, freeDays: Number(formData.freeDays) };
      if (!bodyPayload.password) delete (bodyPayload as any).password;

      const res = await fetch(`/api/credentials/${selectedCredId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      if (res.ok) {
        toast.success("Credential updated");
        setIsEditOpen(false);
        resetForm();
        fetchCredentials();
      } else {
        toast.error("Failed to update credential");
      }
    } catch {
      toast.error("Error updating credential");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this credential?")) return;
    try {
      const res = await fetch(`/api/credentials/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Credential deleted");
        fetchCredentials();
      } else {
        toast.error("Failed to delete credential");
      }
    } catch {
      toast.error("Error deleting credential");
    }
  };

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: linksData }),
      });
      if (res.ok) {
        toast.success("Links updated");
        setIsLinksOpen(false);
        refreshProject();
      } else {
        toast.error("Failed to update links");
      }
    } catch {
      toast.error("Error updating links");
    }
  };

  const resetForm = () => {
    setType("gmail");
    setFormData({ label: "", username: "", password: "", provider: "", startDate: "", freeDays: "0", customDomain: false, domainName: "" });
  };

  const openEditModal = (cred: any) => {
    setSelectedCredId(cred._id);
    setType(cred.type);
    setFormData({
      label: cred.label || "", username: cred.username || "", password: "", provider: cred.provider || "",
      startDate: cred.startDate ? new Date(cred.startDate).toISOString().split("T")[0] : "",
      freeDays: cred.freeDays?.toString() || "0", customDomain: cred.customDomain || false, domainName: cred.domainName || "",
    });
    setIsEditOpen(true);
  };

  const renderCardDetails = (cred: any) => {
    if (cred.type === "hosting") {
      let daysLeftText = "";
      let colorType = "default";
      if (cred.expiryDate) {
        const diffTime = new Date(cred.expiryDate).getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysLeftText = diffDays > 0 ? `${diffDays} days left` : "Expired";
        colorType = diffDays > 30 ? "success" : diffDays > 10 ? "warning" : "danger";
      }
      return (
        <>
          <p className="text-sm"><span className="text-muted-foreground">Provider:</span> {cred.provider}</p>
          {cred.expiryDate && <div className="mt-2"><Badge variant={colorType as any}>{daysLeftText}</Badge></div>}
          {cred.customDomain && <Badge variant="outline" className="mt-2 ml-2">Custom Domain: {cred.domainName}</Badge>}
        </>
      );
    }
    return null;
  };

  const LinkCard = ({ title, url, icon: Icon }: any) => (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-md border border-border"><Icon className="h-5 w-5 text-muted-foreground" /></div>
          <div>
            <h4 className="font-medium text-sm flex items-center gap-2">
              {title} {url ? <span className="h-2 w-2 rounded-full bg-success"></span> : <span className="h-2 w-2 rounded-full bg-muted"></span>}
            </h4>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline line-clamp-1">{url}</a>
            ) : (
              <p className="text-xs text-muted-foreground">Not configured</p>
            )}
          </div>
        </div>
        {url && (
          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied to clipboard"); }}>
            Copy
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Project Links</h3>
          {role === "admin" && (
            <Button onClick={() => setIsLinksOpen(true)} size="sm" variant="outline">
              <Pencil className="h-4 w-4 mr-2" /> Edit Links
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LinkCard title="Live/Final URL" url={project.links?.finalUrl} icon={ExternalLink} />
          <LinkCard title="Staging URL" url={project.links?.stagingUrl} icon={ExternalLink} />
          <LinkCard title="GitHub Repo" url={project.links?.githubUrl} icon={LinkIcon} />
          <LinkCard title="Figma Design" url={project.links?.figmaUrl} icon={LinkIcon} />
          <LinkCard title="Google Drive" url={project.links?.driveUrl} icon={LinkIcon} />
          <LinkCard title="Admin/CMS URL" url={project.links?.adminUrl} icon={LinkIcon} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold">Secure Credentials</h3>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <ShieldAlert className="h-4 w-4 mr-1 text-warning" /> Password reveals are tracked in the audit log.
            </p>
          </div>
          {role === "admin" && (
            <Button onClick={() => { resetForm(); setIsAddOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Credential
            </Button>
          )}
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : credentials.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No credentials stored yet.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {credentials.map((cred) => (
              <Card key={cred._id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg capitalize flex items-center justify-between">
                    <span>{cred.label || cred.type}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{cred.type}</Badge>
                      {role === "admin" && (
                        <>
                          <button onClick={() => openEditModal(cred)} className="text-muted-foreground hover:text-white transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(cred._id)} className="text-muted-foreground hover:text-danger transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><span className="text-muted-foreground">Username:</span> {cred.username || "N/A"}</p>
                  <div className="flex items-center justify-between bg-background p-2 rounded border border-border">
                    <span className="font-mono text-sm tracking-wider">{revealedPasswords[cred._id] || "••••••••"}</span>
                    <Button variant="ghost" size="sm" onClick={() => revealPassword(cred._id)} className="h-6 px-2 text-xs">
                      <Eye className="h-3 w-3 mr-1" /> {revealedPasswords[cred._id] ? "Hide" : "Reveal"}
                    </Button>
                  </div>
                  {renderCardDetails(cred)}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isLinksOpen} onClose={() => setIsLinksOpen(false)} title="Edit Project Links">
        <form onSubmit={handleSaveLinks} className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pb-1">
          <div className="space-y-2"><Label>Live/Final URL</Label><Input type="url" value={linksData.finalUrl} onChange={e=>setLinksData({...linksData, finalUrl: e.target.value})}/></div>
          <div className="space-y-2"><Label>Staging URL</Label><Input type="url" value={linksData.stagingUrl} onChange={e=>setLinksData({...linksData, stagingUrl: e.target.value})}/></div>
          <div className="space-y-2"><Label>GitHub Repo URL</Label><Input type="url" value={linksData.githubUrl} onChange={e=>setLinksData({...linksData, githubUrl: e.target.value})}/></div>
          <div className="space-y-2"><Label>Figma Design URL</Label><Input type="url" value={linksData.figmaUrl} onChange={e=>setLinksData({...linksData, figmaUrl: e.target.value})}/></div>
          <div className="space-y-2"><Label>Google Drive URL</Label><Input type="url" value={linksData.driveUrl} onChange={e=>setLinksData({...linksData, driveUrl: e.target.value})}/></div>
          <div className="space-y-2"><Label>Admin/CMS URL</Label><Input type="url" value={linksData.adminUrl} onChange={e=>setLinksData({...linksData, adminUrl: e.target.value})}/></div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button type="button" variant="outline" onClick={() => setIsLinksOpen(false)}>Cancel</Button>
            <Button type="submit">Save Links</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Secure Credential">
        {/* ... form content unchanged, handled same as before but abbreviated for brevity here to avoid repeating code block twice... */}
         <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="gmail">Gmail</option>
              <option value="hosting">Hosting</option>
              <option value="domain">Domain</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Label (Optional)</Label>
            <Input value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} placeholder="e.g. Production DB" />
          </div>
          <div className="space-y-2">
            <Label>Username / Email</Label>
            <Input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button type="submit">Save Encrypted</Button></div>
        </form>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Credential">
        {/* ... */}
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-2">
            <Label>Label (Optional)</Label>
            <Input value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} placeholder="e.g. Production DB" />
          </div>
          <div className="space-y-2">
            <Label>Username / Email</Label>
            <Input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>New Password (Leave blank to keep unchanged)</Label>
            <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>
          <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button><Button type="submit">Update Encrypted</Button></div>
        </form>
      </Modal>
    </div>
  );
}
