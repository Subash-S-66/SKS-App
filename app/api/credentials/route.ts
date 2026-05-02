import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Credential } from "@/models/Credential"
import { Project } from "@/models/Project"
import { AuditLog } from "@/models/AuditLog"
import { encrypt, decrypt } from "@/lib/encrypt"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: "Project ID is required" }, { status: 400 })

    await dbConnect()

    // Access check
    if (session.user.role !== "admin") {
      const project = await Project.findById(projectId)
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

      const hasAccess =
        (session.user.role === "bde" && project.assignedBDE?.toString() === session.user.id) ||
        (session.user.role === "developer" && project.assignedDevelopers.some(d => d.toString() === session.user.id))

      if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const credentials = await Credential.findOne({ projectId })

    // Do NOT return decrypted passwords. Return boolean flags indicating existence
    if (credentials) {
      const safeCreds = credentials.toObject()
      safeCreds.gmailPassword = !!safeCreds.gmailPassword ? "●●●●●●●" : ""
      safeCreds.hostingPassword = !!safeCreds.hostingPassword ? "●●●●●●●" : ""
      safeCreds.otherCredentials = safeCreds.otherCredentials.map((c: any) => ({
        ...c,
        password: !!c.password ? "●●●●●●●" : ""
      }))
      return NextResponse.json(safeCreds)
    }

    return NextResponse.json(null)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch credentials" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { projectId, ...credsData } = body

    if (!projectId) return NextResponse.json({ error: "Project ID is required" }, { status: 400 })

    await dbConnect()

    // Encrypt passwords
    if (credsData.gmailPassword) credsData.gmailPassword = encrypt(String(credsData.gmailPassword))
    if (credsData.hostingPassword) credsData.hostingPassword = encrypt(String(credsData.hostingPassword))
    if (credsData.otherCredentials) {
      credsData.otherCredentials = credsData.otherCredentials.map((c: any) => ({
        ...c,
        password: c.password ? encrypt(String(c.password)) : ""
      }))
    }

    const credential = await Credential.findOneAndUpdate(
      { projectId },
      { $set: credsData },
      { new: true, upsert: true }
    )

    return NextResponse.json(credential)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save credentials" }, { status: 500 })
  }
}
