import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"
import { logActivity } from "@/lib/activity"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { links } = await req.json()
    await dbConnect()

    const project = await Project.findByIdAndUpdate(params.id, { $set: { links } }, { new: true })
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    await logActivity({
      projectId: project._id,
      userId: session.user.id,
      action: `Updated project links`,
      type: 'link'
    });

    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update links" }, { status: 500 })
  }
}
