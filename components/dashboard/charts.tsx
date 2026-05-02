"use client"
import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, Legend } from "recharts"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444'];

export function DashboardCharts() {
  const [data, setData] = useState<{ statusData: any[], monthData: any[] }>({ statusData: [], monthData: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const res = await fetch("/api/dashboard-charts")
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch charts")
      } finally {
        setLoading(false)
      }
    }
    fetchCharts()
  }, [])

  if (loading) return <div className="h-64 flex items-center justify-center text-slate-400">Loading charts...</div>

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4 bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Projects by Month</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <BarTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-3 bg-slate-900 border-slate-800 text-white">
        <CardHeader>
          <CardTitle>Projects by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <PieTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
