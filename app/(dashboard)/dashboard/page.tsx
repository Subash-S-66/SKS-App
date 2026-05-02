import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"
import { User } from "@/models/User"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, CheckCircle, Clock, Users, UserCheck, Briefcase, AlertTriangle } from "lucide-react"
import { redirect } from "next/navigation"
import { DashboardCharts } from "@/components/dashboard/charts"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  await dbConnect()

  const role = session.user.role
  const userId = session.user.id

  let totalProjects = 0
  let ongoingProjects = 0
  let completedProjects = 0
  let totalUsers = 0
  let totalBDEs = 0
  let totalDevelopers = 0

  // Check if admin is still using default password
  let needsPasswordChange = false;

  if (role === "admin") {
    totalProjects = await Project.countDocuments()
    ongoingProjects = await Project.countDocuments({ status: "ongoing" })
    completedProjects = await Project.countDocuments({ status: "completed" })
    totalUsers = await User.countDocuments()
    totalBDEs = await User.countDocuments({ role: "bde" })
    totalDevelopers = await User.countDocuments({ role: "developer" })

    // Check password
    const adminUser = await User.findById(userId);
    if (adminUser) {
        const bcrypt = require('bcryptjs');
        needsPasswordChange = await bcrypt.compare("SKSAdmin@2024", adminUser.password);
    }
  } else if (role === "bde") {
    totalProjects = await Project.countDocuments({ assignedBDE: userId })
    ongoingProjects = await Project.countDocuments({ assignedBDE: userId, status: "ongoing" })
    completedProjects = await Project.countDocuments({ assignedBDE: userId, status: "completed" })
  } else if (role === "developer") {
    totalProjects = await Project.countDocuments({ assignedDevelopers: userId })
    ongoingProjects = await Project.countDocuments({ assignedDevelopers: userId, status: "ongoing" })
    completedProjects = await Project.countDocuments({ assignedDevelopers: userId, status: "completed" })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      {needsPasswordChange && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <div className="flex-1">
                <p className="font-medium">First Time Setup: Default Password Detected</p>
                <p className="text-sm opacity-90">Please change your default admin password immediately for security reasons.</p>
            </div>
            <Link href="/settings" className="bg-red-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-600 transition-colors">
                Change Password
            </Link>
        </div>
      )}

      <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing Projects</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ongoingProjects}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
          </CardContent>
        </Card>

        {role === "admin" && (
          <>
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total BDEs</CardTitle>
                <Briefcase className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBDEs}</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Developers</CardTitle>
                <UserCheck className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDevelopers}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <DashboardCharts />
    </div>
  )
}
