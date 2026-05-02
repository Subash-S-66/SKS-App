import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Credential } from "@/models/Credential"
import { Project } from "@/models/Project"
import { AuditLog } from "@/models/AuditLog"
import { decrypt } from "@/lib/encrypt"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId, field, otherIndex } = await req.json()
    if (!projectId || !field) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

    await dbConnect()

    // Access check
    const project = await Project.findById(projectId)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    if (session.user.role !== "admin") {
      const hasAccess =
        (session.user.role === "bde" && project.assignedBDE?.toString() === session.user.id) ||
        (session.user.role === "developer" && project.assignedDevelopers.some(d => d.toString() === session.user.id))

      if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const credentials = await Credential.findOne({ projectId })
    if (!credentials) return NextResponse.json({ error: "Credentials not found" }, { status: 404 })

    let decryptedPassword = ""
    let logFieldDesc = ""

    if (field === "gmailPassword" && credentials.gmailPassword) {
      decryptedPassword = decrypt(credentials.gmailPassword)
      logFieldDesc = "Gmail Password"
    } else if (field === "hostingPassword" && credentials.hostingPassword) {
      decryptedPassword = decrypt(credentials.hostingPassword)
      logFieldDesc = "Hosting Password"
    } else if (field === "otherCredentials" && otherIndex !== undefined) {
      const target = credentials.otherCredentials[otherIndex]
      if (target && target.password) {
        decryptedPassword = decrypt(target.password)
        logFieldDesc = `Other Credential (${target.label}) Password`
      }
    }

    if (!decryptedPassword) {
      return NextResponse.json({ error: "Password not set or invalid field" }, { status: 400 })
    }

    // Log the reveal action
    await AuditLog.create({
      user: session.user.id,
      action: "REVEAL_CREDENTIAL",
      details: `Revealed ${logFieldDesc} for project: ${project.clientName} (sNo: ${project.sNo})`,
      ipAddress: req.headers.get("x-forwarded-for") || req.ip || "unknown"
    })

    return NextResponse.json({ password: decryptedPassword })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reveal credential" }, { status: 500 })
  }
}
