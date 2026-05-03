import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Project } from "@/models/Project";
import { ActivityLog } from "@/models/ActivityLog";
import { sendEmail } from "@/lib/email";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await Project.findById(params.id)
      .populate("assignedBDE", "name role")
      .populate("assignedDevelopers", "name role")
      .populate("demos.conductedBy", "name")
      .populate("payment.transactions.recordedBy", "name")
      .populate("settlements.userId", "name role");

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (session.user.role === "bde" && project.assignedBDE._id.toString() !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      session.user.role === "developer" &&
      !project.assignedDevelopers.some((dev: any) => dev._id.toString() === session.user.id)
    ) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json(project);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

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

    const oldProject = await Project.findById(params.id);
    const project = await Project.findByIdAndUpdate(params.id, body, { new: true })
      .populate("assignedBDE", "name role")
      .populate("assignedDevelopers", "name role");

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (body.links && (!oldProject?.links || JSON.stringify(body.links) !== JSON.stringify(oldProject.links))) {
      await ActivityLog.create({
        projectId: project._id,
        userId: session.user.id,
        action: "Updated Project Links",
        type: "link"
      });
    }

    if (body.status && oldProject?.status !== body.status) {
      await ActivityLog.create({
        projectId: project._id,
        userId: session.user.id,
        action: `Changed project status from ${oldProject?.status} to ${body.status}`,
        type: "status"
      });

      if (body.status === "completed") {
        const emails: string[] = [];
        if ((project.assignedBDE as any)?.email) emails.push((project.assignedBDE as any).email);
        project.assignedDevelopers.forEach(dev => {
          if ((dev as any).email) emails.push((dev as any).email);
        });

        for (const email of emails) {
          await sendEmail({
            to: email,
            subject: `Project Completed: ${project.clientName}`,
            html: `<p>The project ${project.clientName} has been marked as completed.</p>`,
            projectId: project._id.toString(),
            type: "project_completed"
          });
        }
      }
    }

    return Response.json(project);
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

    const project = await Project.findByIdAndDelete(params.id);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}