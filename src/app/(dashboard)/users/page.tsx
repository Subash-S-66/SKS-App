"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Plus, Ban, CheckCircle2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "developer",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("User created successfully");
        setIsAddOpen(false);
        resetForm();
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create user");
      }
    } catch {
      toast.error("Error creating user");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete (payload as any).password;

      const res = await fetch(`/api/users/${selectedUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("User updated successfully");
        setIsEditOpen(false);
        resetForm();
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update user");
      }
    } catch {
      toast.error("Error updating user");
    }
  };

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchUsers();
      }
    } catch {
      toast.error("Error updating user status");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", username: "", email: "", password: "", role: "developer" });
  };

  const openEditModal = (user: any) => {
    setSelectedUserId(user._id);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
    setIsEditOpen(true);
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") return <Badge variant="danger">Admin</Badge>;
    if (role === "bde") return <Badge variant="primary">BDE</Badge>;
    return <Badge variant="info">Developer</Badge>;
  };

  const formFields = (isEdit: boolean) => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Username</Label>
          <Input required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>{isEdit ? "New Password" : "Initial Password"}</Label>
        <Input type="password" required={!isEdit} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
        {isEdit && <p className="text-xs text-muted-foreground">Leave blank to keep unchanged.</p>}
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <select
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="developer">Developer</option>
          <option value="bde">BDE</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground mt-1">Add and manage system users</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Projects</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 hidden md:table-cell">Joined</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="border-b border-border hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold">{user.name}</div>
                            <div className="text-xs text-muted-foreground">@{user.username} &bull; {user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                      <td className="px-6 py-4 font-medium">{user.projectCount}</td>
                      <td className="px-6 py-4">
                        {user.isActive ? (
                          <Badge variant="success" className="bg-success/20 text-success border-success/30 border">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={user.isActive ? "text-danger hover:bg-danger/10 hover:text-danger" : "text-success hover:bg-success/10 hover:text-success"}
                            onClick={() => toggleActive(user._id, user.isActive)}
                          >
                            {user.isActive ? <Ban className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {user.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New User">
        <form onSubmit={handleAddUser} className="space-y-4">
          {formFields(false)}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User">
        <form onSubmit={handleEditUser} className="space-y-4">
          {formFields(true)}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
