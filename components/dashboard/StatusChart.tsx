"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

interface StatusChartProps {
  data: {
    ongoing: number;
    completed: number;
    onHold: number;
  };
}

export default function StatusChart({ data }: StatusChartProps) {
  const chartData = [
    { name: "Ongoing", value: data.ongoing, color: "#3b82f6" },
    { name: "Completed", value: data.completed, color: "#22c55e" },
    { name: "On Hold", value: data.onHold, color: "#eab308" },
  ].filter(item => item.value > 0);

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Projects by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <FolderOpen className="h-12 w-12 mb-2 opacity-20" />
            <p>No data yet</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}