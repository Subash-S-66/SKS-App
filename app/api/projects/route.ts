import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Project } from "@/models/Project";
import { ActivityLog } from "@/models/ActivityLog";
import { sendEmail } from "@/lib/email";
import { User } from "@/models/User";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const query: any = {};

    if (session.user.role === "bde") {
      query.assignedBDE = session.user.id;
    } else if (session.user.role === "developer") {
      query.assignedDevelopers = session.user.id;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate("assignedBDE", "name role email")
      .populate("assignedDevelopers", "name role email")
      .sort({ createdAt: -1 });

    return Response.json(projects);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const project = await Project.create(body);

    await ActivityLog.create({
      projectId: project._id,
      userId: session.user.id,
      action: `Project created: ${project.clientName}`,
      type: "status",
      metadata: { sNo: project.sNo }
    });

    // Populate BDE and Developers to get emails
    const populatedProject = await Project.findById(project._id)
      .populate("assignedBDE", "name email")
      .populate("assignedDevelopers", "name email");

    if (populatedProject) {
      const bdeEmail = (populatedProject.assignedBDE as any)?.email;
      if (bdeEmail) {
        await sendEmail({
          to: bdeEmail,
          subject: `New Project Assigned: ${project.clientName} - ${project.companyName}`,
          html: `<p>You have been assigned as the BDE for a new project.</p><p>Client: ${project.clientName}</p><p>Log in to view details.</p>`,
          projectId: project._id.toString(),
          type: "project_created"
        });
      }

      for (const dev of populatedProject.assignedDevelopers) {
        if ((dev as any).email) {
          await sendEmail({
            to: (dev as any).email,
            subject: `New Project Assigned: ${project.clientName} - ${project.companyName}`,
            html: `<p>You have been assigned as a Developer for a new project.</p><p>Client: ${project.clientName}</p><p>Log in to view details.</p>`,
            projectId: project._id.toString(),
            type: "project_created"
          });
        }
      }
    }

    return Response.json(project, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}