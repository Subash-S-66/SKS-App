import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Requirement } from "@/models/Requirement"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role === 'bde') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status, logNote } = await req.json()
    await dbConnect()

    const requirement = await Requirement.findById(params.id)
    if (!requirement) return NextResponse.json({ error: "Requirement not found" }, { status: 404 })

    if (status) requirement.status = status
    if (logNote) {
      requirement.developerLogs.push({
        developer: session.user.id,
        note: logNote,
        timestamp: new Date()
      } as any)
    }

    await requirement.save()
    return NextResponse.json(requirement)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update requirement" }, { status: 500 })
  }
}
