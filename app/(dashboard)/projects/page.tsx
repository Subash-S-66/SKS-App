"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground text-slate-400">Manage all agency projects.</p>
        </div>
        {session?.user?.role === "admin" && (
          <Link href="/projects/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create Project</Button>
          </Link>
        )}
      </div>

      <div className="rounded-md border border-slate-800 bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400 w-16">S.No</TableHead>
              <TableHead className="text-slate-400">Client / Company</TableHead>
              <TableHead className="text-slate-400">Type</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Start Date</TableHead>
              <TableHead className="text-slate-400 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-400">Loading projects...</TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-400">No projects found.</TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
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
                    {new Date(project.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/projects/${project._id}`}>
                      <Button variant="outline" size="sm" className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-white">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
