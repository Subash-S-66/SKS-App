import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"
import { User } from "@/models/User"
import { sendEmail } from "@/lib/email"
import { logActivity } from "@/lib/activity"

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

    // Default URL initialization
    const projectUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const project = await Project.create(body)

    // Activity Log
    await logActivity({
      projectId: project._id,
      userId: session.user.id,
      action: `Created project: ${project.clientName} (${project.companyName})`,
      type: 'general'
    });

    // Notify assigned team members
    const recipients: string[] = [];
    if (project.assignedBDE) {
      const bde = await User.findById(project.assignedBDE);
      if (bde) recipients.push(bde.email);
    }

    if (project.assignedDevelopers && project.assignedDevelopers.length > 0) {
       for (const devId of project.assignedDevelopers) {
          const dev = await User.findById(devId);
          if (dev) recipients.push(dev.email);
       }
    }

    if (recipients.length > 0) {
      await sendEmail({
        to: recipients,
        subject: `New Project Assigned: ${project.clientName} - ${project.companyName}`,
        html: `
          <h3>You have been assigned to a new project!</h3>
          <p><strong>Client:</strong> ${project.clientName}</p>
          <p><strong>Company:</strong> ${project.companyName}</p>
          <p><strong>Type:</strong> ${project.typeOfJob}</p>
          <p><strong>Start Date:</strong> ${new Date(project.startDate).toLocaleDateString()}</p>
          <p><a href="${projectUrl}/projects/${project._id}">Click here to view the project dashboard</a></p>
        `,
        projectId: project._id.toString(),
        type: 'project_assigned'
      });
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 })
  }
}
