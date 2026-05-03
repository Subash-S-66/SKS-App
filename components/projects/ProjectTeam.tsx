"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Briefcase, Code } from "lucide-react";

export function ProjectTeam({ project }: { project: any }) {
  if (!project) return null;

  const bde = project.assignedBDE;
  const developers = project.assignedDevelopers;
  const shares = project.sharePercentages;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Development</CardTitle>
        </CardHeader>
        <CardContent>
          {bde ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    <Briefcase className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{bde.name}</p>
                  <p className="text-sm text-slate-500 capitalize">{bde.role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 mb-1">Revenue Share</p>
                <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                  {shares?.bde || 20}%
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No BDE assigned.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Development Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {developers && developers.length > 0 ? (
              developers.map((dev: any, index: number) => (
                <div key={dev._id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-700">
                        <Code className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-lg">{dev.name}</p>
                      <p className="text-sm text-slate-500 capitalize">{dev.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">Revenue Share</p>
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                      {shares?.developers[index] || (developers.length === 1 ? 80 : 40)}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No developers assigned.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share Distribution Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-full flex rounded-md overflow-hidden bg-slate-100">
            {/* BDE Bar */}
            <div
              style={{ width: `${shares?.bde || 20}%` }}
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold transition-all"
              title="BDE Share"
            >
              {(shares?.bde || 20) > 10 ? 'BDE' : ''}
            </div>
            {/* Dev Bars */}
            {developers?.map((_: any, index: number) => {
              const devShare = shares?.developers[index] || (developers.length === 1 ? 80 : 40);
              return (
                <div
                  key={index}
                  style={{ width: `${devShare}%` }}
                  className={`${index === 0 ? 'bg-green-500' : 'bg-green-400'} border-l border-white/20 flex items-center justify-center text-white text-xs font-bold transition-all`}
                  title={`Developer ${index + 1} Share`}
                >
                  {devShare > 10 ? `Dev ${index + 1}` : ''}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Total: 100%</span>
            <span>Agency setup automatically allocates these shares.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}