import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import { sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  await dbConnect();

  try {
    const project = await Project.findById(params.id)
      .populate("assignedBDE", "name email role")
      .populate("assignedDevelopers", "name email role")
      .lean();

    if (!project) return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "bde" && project.assignedBDE?.toString() !== userId) return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    if (role === "developer" && !project.assignedDevelopers.some((dev: any) => dev._id.toString() === userId)) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch project" }), { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  if (!session || (role !== "admin" && role !== "bde")) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const oldProject = await Project.findById(params.id);
    if (!oldProject) return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });

    if (role === "bde" && oldProject.assignedBDE?.toString() !== userId) {
        return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    // Only Admin can do full updates. BDE can only update demos realistically for now.
    if (role === "bde") {
        if(body.demos) {
             oldProject.demos = body.demos;
             await oldProject.save();
             await logActivity(params.id, userId, `Updated demos`, "demo");
             return NextResponse.json(oldProject);
        }
        return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    if (body.assignedDevelopers) {
      let devIds = Array.isArray(body.assignedDevelopers) ? body.assignedDevelopers.slice(0, 2) : [body.assignedDevelopers];
      body.assignedDevelopers = devIds;
      let devShares: number[] = [];
      if (devIds.length === 1) devShares = [80];
      else if (devIds.length === 2) devShares = [40, 40];
      body["sharePercentages.developers"] = devShares;
    }

    if (body.status === "completed" && oldProject.status !== "completed") {
      body.completedDate = Date.now();
    } else if (body.status && body.status !== "completed") {
      body.completedDate = null;
    }

    const updatedProject = await Project.findByIdAndUpdate(params.id, body, { new: true })
      .populate("assignedBDE", "name email")
      .populate("assignedDevelopers", "name email");

    if (body.status && body.status !== oldProject.status) {
      await logActivity(params.id, userId, `Status changed from ${oldProject.status} to ${body.status}`, "status");
      if(body.status === "completed") {
          const emails: string[] = [];
          if (updatedProject.assignedBDE?.email) emails.push(updatedProject.assignedBDE.email);
          updatedProject.assignedDevelopers.forEach((d: any) => { if (d.email) emails.push(d.email); });
          if(emails.length > 0) {
              const html = `<p>Project <strong>${updatedProject.clientName}</strong> has been marked as COMPLETED.</p>`;
              sendEmail(emails, `Project Completed: ${updatedProject.clientName}`, html, updatedProject._id, "project_completed").catch(console.error);
          }
      }
    } else {
        await logActivity(params.id, userId, `Updated project details`, "status");
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to update project" }), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  await dbConnect();

  try {
    const deletedProject = await Project.findByIdAndDelete(params.id);
    if (!deletedProject) return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });
    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to delete project" }), { status: 500 });
  }
}
