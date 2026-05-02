import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    const project = await Project.findById(params.id)
      .populate("assignedBDE", "name role")
      .populate("assignedDevelopers", "name role")

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Role check for access
    if (session.user.role === "bde" && project.assignedBDE?._id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (session.user.role === "developer" && !project.assignedDevelopers.some((d: any) => d._id.toString() === session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}
