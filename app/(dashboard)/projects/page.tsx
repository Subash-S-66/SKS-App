"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useSession } from "next-auth/react"

export default function ProjectsPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects")
        if (res.ok) {
          const data = await res.json()
          setProjects(data)
        }
      } catch (error) {
        toast.error("Failed to load projects")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground text-slate-400 text-sm md:text-base">Manage all agency projects.</p>
        </div>
        {session?.user?.role === "admin" && (
          <Link href="/projects/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]">Create Project</Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center p-8 text-slate-400 border border-slate-800 rounded-lg">No projects found.</div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {projects.map((project) => (
              <Card key={project._id} className="bg-slate-900 border-slate-800 text-white">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-white">{project.clientName}</div>
                      <div className="text-sm text-slate-400">{project.companyName}</div>
                    </div>
                    <span className="font-mono text-sm text-slate-500">#{project.sNo}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={`
                      ${project.status === 'completed' ? 'border-green-500 text-green-400' : ''}
                      ${project.status === 'ongoing' ? 'border-blue-500 text-blue-400' : ''}
                      ${project.status === 'on hold' ? 'border-yellow-500 text-yellow-400' : ''}
                    `}>
                      {project.status.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                      {project.typeOfJob}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-400">
                    Payment: <span className={`px-2 py-0.5 rounded text-xs font-medium border ${project.payment?.paymentStatus === 'fully_paid' ? 'text-green-500 bg-green-500/10 border-green-500/20' : project.payment?.paymentStatus === 'partially_paid' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>{project.payment?.paymentStatus?.replace('_' , ' ').toUpperCase() || 'UNPAID'}</span>  <span className="text-slate-300 ml-2">₹{(project.payment?.amountReceived || 0).toLocaleString()} / ₹{(project.payment?.totalAmount || 0).toLocaleString()}</span>
                  </div>

                  <Link href={`/projects/${project._id}`} className="block w-full">
                    <Button variant="outline" className="w-full border-slate-700 bg-slate-950 hover:bg-slate-800 text-white min-h-[44px]">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border border-slate-800 bg-slate-900 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 w-16">S.No</TableHead>
                  <TableHead className="text-slate-400">Client / Company</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Payment Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project._id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-400">#{project.sNo}</TableCell>
                    <TableCell>
                      <div className="font-medium text-white">{project.clientName}</div>
                      <div className="text-sm text-slate-400">{project.companyName}</div>
                    </TableCell>
                    <TableCell className="text-slate-300">{project.typeOfJob}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`
                        ${project.status === 'completed' ? 'border-green-500 text-green-400' : ''}
                        ${project.status === 'ongoing' ? 'border-blue-500 text-blue-400' : ''}
                        ${project.status === 'on hold' ? 'border-yellow-500 text-yellow-400' : ''}
                      `}>
                        {project.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${project.payment?.paymentStatus === 'fully_paid' ? 'text-green-500 bg-green-500/10 border-green-500/20' : project.payment?.paymentStatus === 'partially_paid' ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20'}`}>{project.payment?.paymentStatus?.replace('_' , ' ').toUpperCase() || 'UNPAID'}</span>  <span className="text-slate-300 ml-2">₹{(project.payment?.amountReceived || 0).toLocaleString()} / ₹{(project.payment?.totalAmount || 0).toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/projects/${project._id}`}>
                        <Button variant="outline" size="sm" className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-white min-h-[44px]">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
