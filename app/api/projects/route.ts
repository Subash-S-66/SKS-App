import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    let query = {}
    if (session.user.role === "bde") {
      query = { assignedBDE: session.user.id }
    } else if (session.user.role === "developer") {
      query = { assignedDevelopers: session.user.id }
    }

    const projects = await Project.find(query).sort({ sNo: -1 })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    await dbConnect()

    if (!body.assignedBDE) delete body.assignedBDE;
    const project = await Project.create(body)
    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 })
  }
}
