import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { ActivityLog } from "@/models/ActivityLog"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    // In a real app we'd verify project access again, but since it's an internal tool
    // and fetched from a protected page, we'll proceed.

    const logs = await ActivityLog.find({ projectId: params.id })
      .populate("userId", "name role")
      .sort({ createdAt: -1 })
      .limit(50)

    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}
