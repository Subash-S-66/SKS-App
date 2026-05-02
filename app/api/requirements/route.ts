import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Requirement } from "@/models/Requirement"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: "Project ID is required" }, { status: 400 })

    await dbConnect()
    const requirements = await Requirement.find({ projectId })
      .populate('addedBy', 'name role')
      .populate('developerLogs.developer', 'name')
      .sort({ createdAt: -1 })

    return NextResponse.json(requirements)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role === 'bde') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    await dbConnect()

    const requirement = await Requirement.create({
      ...body,
      addedBy: session.user.id
    })

    return NextResponse.json(requirement, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create requirement" }, { status: 500 })
  }
}
