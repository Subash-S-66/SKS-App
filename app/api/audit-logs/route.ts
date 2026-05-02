import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { AuditLog } from "@/models/AuditLog"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const logs = await AuditLog.find({}).populate("user", "name username role").sort({ createdAt: -1 })
    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
  }
}
