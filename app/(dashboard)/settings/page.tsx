"use client";

import Link from "next/link";
import { Shield, Key, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <Shield className="w-8 h-8 text-blue-500 mb-2" />
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              View trail of sensitive actions, such as credential reveals.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Link href="/settings/audit-logs" className="w-full flex">
               <Button className="w-full">
                 <History className="w-4 h-4 mr-2" /> View Audit Logs
               </Button>
             </Link>
          </CardContent>
        </Card>

        {/* Future settings can go here like Profile, Security, etc. */}
      </div>
    </div>
  );
}