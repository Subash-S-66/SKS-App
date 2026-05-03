import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Requirement } from "@/models/Requirement";
import { ActivityLog } from "@/models/ActivityLog";
import { Project } from "@/models/Project";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    if (!projectId) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }

    await connectDB();

    // Auth Check
    const project = await Project.findById(projectId);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    if (session.user.role === "bde" && project.assignedBDE.toString() !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.user.role === "developer" && !project.assignedDevelopers.some(d => d.toString() === session.user.id)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const requirements = await Requirement.find({ projectId })
      .populate("addedBy", "name")
      .populate("developerLogs.developer", "name")
      .sort({ createdAt: -1 });

    return Response.json(requirements);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const projectToAuth = await Project.findById(body.projectId);
    if (!projectToAuth) return Response.json({ error: "Project not found" }, { status: 404 });
    if (session.user.role === "bde" && projectToAuth.assignedBDE.toString() !== session.user.id) return Response.json({ error: "Forbidden" }, { status: 403 });
    if (session.user.role === "developer" && !projectToAuth.assignedDevelopers.some(d => d.toString() === session.user.id)) return Response.json({ error: "Forbidden" }, { status: 403 });

    const requirement = await Requirement.create({
      ...body,
      addedBy: session.user.id,
    });

    await ActivityLog.create({
      projectId: body.projectId,
      userId: session.user.id,
      action: `Added requirement: ${body.title}`,
      type: "requirement",
      metadata: { requirementId: requirement._id }
    });

    // Notify Developers
    const project = await Project.findById(body.projectId).populate("assignedDevelopers", "email");
    if (project && project.assignedDevelopers) {
      for (const dev of project.assignedDevelopers) {
        if ((dev as any).email) {
          await sendEmail({
            to: (dev as any).email,
            subject: `New Requirement Added: ${project.clientName}`,
            html: `<p>A new requirement "${body.title}" has been added to project ${project.clientName}.</p>`,
            projectId: project._id.toString(),
            type: "requirement_added"
          });
        }
      }
    }

    return Response.json(requirement, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}