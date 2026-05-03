"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Eye, Edit, Plus, Key, Mail, Server, Globe, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

export function ProjectCredentials({ projectId, projectLinks, onUpdate }: { projectId: string, projectLinks?: any, onUpdate: (p: any) => void }) {
  const { data: session } = useSession();
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkEditOpen, setIsLinkEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [editLinkData, setEditLinkData] = useState<any>(projectLinks || {});

  const fetchCredentials = async (reveal = false) => {
    try {
      const url = `/api/credentials?projectId=${projectId}${reveal ? "&reveal=true" : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCredentials(data);
        if (!reveal && data) {
          setEditFormData({
            ...data,
            gmailPassword: "",
            hostingPassword: "",
          });
        }
      }
    } catch (error) {
      toast.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, [projectId]);

  const handleReveal = async () => {
    if (!confirm("Are you sure? This action will be logged in the audit trail.")) return;
    toast.info("Decrypting credentials...");
    await fetchCredentials(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...editFormData, projectId };
      if (!payload.gmailPassword) delete payload.gmailPassword;
      if (!payload.hostingPassword) delete payload.hostingPassword;

      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Credentials saved");
        setIsEditOpen(false);
        fetchCredentials();
      }
    } catch (error) {
      toast.error("Error saving credentials");
    }
  };

  const handleLinkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: editLinkData }),
      });

      if (res.ok) {
        toast.success("Links saved");
        setIsLinkEditOpen(false);
        const updatedProject = await res.json();
        onUpdate(updatedProject);
      }
    } catch (error) {
      toast.error("Error saving links");
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) return <div>Loading...</div>;

  const isAdmin = session?.user?.role === "admin";
  const hasCreds = !!credentials;

  return (
    <div className="space-y-8">
      {/* Project Links Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold flex items-center"><LinkIcon className="w-5 h-5 mr-2" /> Project Links</h3>
          {isAdmin && (
            <Dialog open={isLinkEditOpen} onOpenChange={setIsLinkEditOpen}>
              <DialogTrigger>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" /> Edit Links
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Project Links</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleLinkSave} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Final / Live URL</Label>
                    <Input value={editLinkData.finalUrl || ""} onChange={e => setEditLinkData({...editLinkData, finalUrl: e.target.value})} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <Label>Staging URL</Label>
                    <Input value={editLinkData.stagingUrl || ""} onChange={e => setEditLinkData({...editLinkData, stagingUrl: e.target.value})} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <Label>Admin / CMS URL</Label>
                    <Input value={editLinkData.adminUrl || ""} onChange={e => setEditLinkData({...editLinkData, adminUrl: e.target.value})} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hosting Panel URL</Label>
                    <Input value={editLinkData.hostedUrl || ""} onChange={e => setEditLinkData({...editLinkData, hostedUrl: e.target.value})} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <Label>GitHub URL</Label>
                    <Input value={editLinkData.githubUrl || ""} onChange={e => setEditLinkData({...editLinkData, githubUrl: e.target.value})} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <Label>Figma URL</Label>
                    <Input value={editLinkData.figmaUrl || ""} onChange={e => setEditLinkData({...editLinkData, figmaUrl: e.target.value})} placeholder="https://" />
                  </div>
                  <div className="space-y-2">
                    <Label>Google Drive URL</Label>
                    <Input value={editLinkData.driveUrl || ""} onChange={e => setEditLinkData({...editLinkData, driveUrl: e.target.value})} placeholder="https://" />
                  </div>
                  <Button type="submit" className="w-full">Save Links</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Live URL", url: projectLinks?.finalUrl },
            { label: "Staging URL", url: projectLinks?.stagingUrl },
            { label: "Admin URL", url: projectLinks?.adminUrl },
            { label: "Hosting", url: projectLinks?.hostedUrl },
            { label: "GitHub", url: projectLinks?.githubUrl },
            { label: "Figma", url: projectLinks?.figmaUrl },
            { label: "Google Drive", url: projectLinks?.driveUrl },
          ].map((item, i) => (
            <Card key={i} className="bg-slate-50 dark:bg-slate-900/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.url ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <span className="text-sm font-medium truncate text-slate-700 dark:text-slate-300">{item.label}</span>
                </div>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 flex-shrink-0 ml-2">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="border-t pt-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold flex items-center"><Key className="w-5 h-5 mr-2" /> Project Credentials</h3>
          <div className="space-x-2">
            {hasCreds && (
              <Button variant="outline" onClick={handleReveal} size="sm">
                <Eye className="w-4 h-4 mr-2" /> Reveal Passwords
              </Button>
            )}
            {isAdmin && (
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger>
                  <Button size="sm">
                    {hasCreds ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {hasCreds ? "Edit Credentials" : "Add Credentials"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{hasCreds ? "Edit" : "Add"} Credentials</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSave} className="space-y-6 mt-4">
                    {/* Form fields for Gmail */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <h4 className="font-medium flex items-center"><Mail className="w-4 h-4 mr-2"/> Gmail Credentials</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email Created</Label>
                          <Input
                            value={editFormData.gmailCreated || ""}
                            onChange={e => setEditFormData({...editFormData, gmailCreated: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password {hasCreds && "(leave blank to keep current)"}</Label>
                          <Input
                            type="password"
                            value={editFormData.gmailPassword || ""}
                            onChange={e => setEditFormData({...editFormData, gmailPassword: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Form fields for Hosting */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <h4 className="font-medium flex items-center"><Server className="w-4 h-4 mr-2"/> Hosting Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Provider</Label>
                          <Input value={editFormData.hostingProvider || ""} onChange={e => setEditFormData({...editFormData, hostingProvider: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Username</Label>
                          <Input value={editFormData.hostingUsername || ""} onChange={e => setEditFormData({...editFormData, hostingUsername: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Password {hasCreds && "(leave blank to keep current)"}</Label>
                          <Input type="password" value={editFormData.hostingPassword || ""} onChange={e => setEditFormData({...editFormData, hostingPassword: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input type="date" value={editFormData.hostingStartDate ? new Date(editFormData.hostingStartDate).toISOString().split('T')[0] : ""} onChange={e => setEditFormData({...editFormData, hostingStartDate: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Free Days (e.g., 365)</Label>
                          <Input type="number" value={editFormData.hostingFreeDays || ""} onChange={e => setEditFormData({...editFormData, hostingFreeDays: Number(e.target.value)})} />
                        </div>
                      </div>
                    </div>

                    {/* Form fields for Domain */}
                    <div className="space-y-4 border p-4 rounded-md">
                      <h4 className="font-medium flex items-center"><Globe className="w-4 h-4 mr-2"/> Domain Details</h4>
                      <div className="flex items-center space-x-2 mb-4">
                        <input
                          type="checkbox"
                          id="customDomain"
                          checked={editFormData.customDomain || false}
                          onChange={e => setEditFormData({...editFormData, customDomain: e.target.checked})}
                        />
                        <Label htmlFor="customDomain">Custom Domain Included</Label>
                      </div>
                      {editFormData.customDomain && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Domain Name</Label>
                            <Input value={editFormData.customDomainName || ""} onChange={e => setEditFormData({...editFormData, customDomainName: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input type="date" value={editFormData.domainExpiryDate ? new Date(editFormData.domainExpiryDate).toISOString().split('T')[0] : ""} onChange={e => setEditFormData({...editFormData, domainExpiryDate: e.target.value})} />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full">Save Credentials</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {!hasCreds ? (
          <div className="text-center p-12 border border-dashed rounded-lg text-slate-500">
            <Key className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No credentials have been added for this project yet.</p>
            {isAdmin && <p className="text-sm mt-2">Click "Add Credentials" to create them.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Mail className="w-4 h-4 mr-2" /> Email Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Email Address</p>
                  <p className="font-medium cursor-pointer hover:text-blue-500" onClick={() => handleCopy(credentials.gmailCreated)}>{credentials.gmailCreated || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Password</p>
                  <p className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleCopy(credentials.gmailPassword)}>{credentials.gmailPassword || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Server className="w-4 h-4 mr-2" /> Hosting Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Provider</p>
                    <p className="font-medium">{credentials.hostingProvider || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Username</p>
                    <p className="font-medium cursor-pointer hover:text-blue-500" onClick={() => handleCopy(credentials.hostingUsername)}>{credentials.hostingUsername || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Password</p>
                  <p className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => handleCopy(credentials.hostingPassword)}>{credentials.hostingPassword || "N/A"}</p>
                </div>

                {credentials.hostingExpiryDate && (
                  <div className="pt-3 border-t mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-500 uppercase">Expiry Status</p>
                      <p className="text-xs text-slate-500">{format(new Date(credentials.hostingExpiryDate), 'MMM dd, yyyy')}</p>
                    </div>
                    {(() => {
                      const daysLeft = differenceInDays(new Date(credentials.hostingExpiryDate), new Date());
                      const isExpiringSoon = daysLeft <= 30;
                      const isCritical = daysLeft <= 10;
                      const isExpired = daysLeft < 0;

                      return (
                        <Badge variant={isExpired ? "destructive" : isCritical ? "destructive" : isExpiringSoon ? "secondary" : "default"}
                              className={isExpired ? "" : isCritical ? "" : isExpiringSoon ? "bg-yellow-500" : "bg-green-500"}>
                          {isExpired ? "Expired" : `${daysLeft} days left`}
                        </Badge>
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {credentials.customDomain && (
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center"><Globe className="w-4 h-4 mr-2" /> Custom Domain</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Domain Name</p>
                    <p className="font-medium text-lg text-blue-600">{credentials.customDomainName}</p>
                  </div>
                  {credentials.domainExpiryDate && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase">Expiry Date</p>
                      <p className="font-medium">{format(new Date(credentials.domainExpiryDate), 'MMM dd, yyyy')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}