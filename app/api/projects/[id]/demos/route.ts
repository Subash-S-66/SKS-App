import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"
import { logActivity } from "@/lib/activity"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role === 'developer') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    await dbConnect()

    const project = await Project.findById(params.id)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    project.demos.push({
      ...body,
      conductedBy: session.user.id
    });

    await project.save();

    await logActivity({
      projectId: project._id,
      userId: session.user.id,
      action: `Scheduled/Recorded demo for ${new Date(body.demoDate).toLocaleDateString()}`,
      type: 'demo',
      metadata: { outcome: body.outcome }
    });

    const updated = await Project.findById(params.id)
      .populate("demos.conductedBy", "name")

    return NextResponse.json(updated, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record demo" }, { status: 500 })
  }
}
