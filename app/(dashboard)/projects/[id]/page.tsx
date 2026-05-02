"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ArrowLeft, DollarSign, Calendar, Target } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { RequirementsTab } from "@/components/projects/requirements-tab"
import { CredentialsTab } from "@/components/projects/credentials-tab"
import { TeamTab } from "@/components/projects/team-tab"

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${id}`)
        if (res.ok) {
          const data = await res.json()
          setProject(data)
        } else {
          toast.error("Failed to load project details")
        }
      } catch (error) {
        toast.error("An error occurred")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchProject()
  }, [id])

  if (loading) return <div className="text-slate-400 p-8">Loading project details...</div>
  if (!project) return <div className="text-slate-400 p-8">Project not found or access denied.</div>

  const isDeveloper = session?.user?.role === "developer"
  const isBDE = session?.user?.role === "bde"

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/projects">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{project.clientName}</h2>
            <Badge variant="outline" className={`
              ${project.status === 'completed' ? 'border-green-500 text-green-400' : ''}
              ${project.status === 'ongoing' ? 'border-blue-500 text-blue-400' : ''}
              ${project.status === 'on hold' ? 'border-yellow-500 text-yellow-400' : ''}
            `}>
              {project.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground text-slate-400">{project.companyName} • {project.typeOfJob}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-lg w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Overview</TabsTrigger>
          <TabsTrigger value="requirements" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Requirements</TabsTrigger>
          <TabsTrigger value="credentials" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Credentials</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400">Team & Shares</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6 m-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${project.projectBudget}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Start Date</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{new Date(project.startDate).toLocaleDateString()}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Month / Year</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{project.monthForProject}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-sm block">System ID</span>
                    <span className="font-mono">#{project.sNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-sm block">Type</span>
                    <span>{project.typeOfJob}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="m-0">
            <RequirementsTab projectId={id as string} />
          </TabsContent>

          <TabsContent value="credentials" className="m-0">
             <CredentialsTab projectId={id as string} />
          </TabsContent>

          <TabsContent value="team" className="m-0 space-y-6">
            <TeamTab project={project} onUpdate={(p) => setProject(p)} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
