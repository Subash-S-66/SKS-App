import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Requirement } from "@/models/Requirement";
import { ActivityLog } from "@/models/ActivityLog";
import { Project } from "@/models/Project";
import { sendEmail } from "@/lib/email";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const oldReq = await Requirement.findById(params.id);
    if (!oldReq) return Response.json({ error: "Requirement not found" }, { status: 404 });

    // Auth Check
    const project = await Project.findById(oldReq.projectId);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    if (session.user.role === "bde" && project.assignedBDE.toString() !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.user.role === "developer" && !project.assignedDevelopers.some(d => d.toString() === session.user.id)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.title && session.user.role === "admin") updateData.title = body.title;
    if (body.description && session.user.role === "admin") updateData.description = body.description;

    if (body.newLog) {
      updateData.$push = {
        developerLogs: {
          developer: session.user.id,
          note: body.newLog,
          timestamp: new Date(),
        },
      };
    }

    const requirement = await Requirement.findByIdAndUpdate(params.id, updateData, { new: true });

    if (body.status && oldReq.status !== body.status) {
      await ActivityLog.create({
        projectId: requirement!.projectId,
        userId: session.user.id,
        action: `Updated requirement status for "${requirement!.title}" to ${body.status}`,
        type: "requirement"
      });
    }

    if (body.newLog) {
      await ActivityLog.create({
        projectId: requirement!.projectId,
        userId: session.user.id,
        action: `Added developer log to requirement: "${requirement!.title}"`,
        type: "requirement"
      });
    }

    const populatedProject = await Project.findById(project._id).populate("assignedDevelopers", "email");
    if (populatedProject && populatedProject.assignedDevelopers) {
      for (const dev of populatedProject.assignedDevelopers) {
        if ((dev as any).email) {
          await sendEmail({
            to: (dev as any).email,
            subject: `Requirement Updated: ${project.clientName}`,
            html: `<p>The requirement "${requirement!.title}" has been updated.</p>`,
            projectId: project._id.toString(),
            type: "requirement_updated"
          });
        }
      }
    }

    return Response.json(requirement);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const requirement = await Requirement.findByIdAndDelete(params.id);

    if (!requirement) {
      return Response.json({ error: "Requirement not found" }, { status: 404 });
    }

    return Response.json({ message: "Requirement deleted successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}