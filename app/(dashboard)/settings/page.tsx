"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Shield, Key, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        }),
      });

      if (res.ok) {
        toast.success("Password updated successfully");
        setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto md:mx-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Key className="w-8 h-8 text-blue-500 mb-2" />
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your account password securely.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <Shield className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                View trail of sensitive actions across the entire agency, such as credential reveals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/audit-logs" className="w-full flex">
                <Button className="w-full" variant="secondary">
                  <History className="w-4 h-4 mr-2" /> View Audit Logs
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}