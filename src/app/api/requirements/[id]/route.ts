import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Requirement from "@/models/Requirement";
import Project from "@/models/Project";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  await dbConnect();

  try {
    const requirement = await Requirement.findById(params.id);
    if (!requirement) return new NextResponse(JSON.stringify({ error: "Requirement not found" }), { status: 404 });

    const project = await Project.findById(requirement.projectId);
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "bde" && project?.assignedBDE?.toString() !== userId) return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    if (role === "developer" && !project?.assignedDevelopers.includes(userId)) return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    const body = await req.json();

    if (body.logNote) {
      requirement.developerLogs.push({ developer: userId as any, note: body.logNote, timestamp: new Date() });
      await logActivity(requirement.projectId.toString(), userId, `Added dev log to requirement: ${requirement.title}`, "requirement");
    }

    if (body.status && body.status !== requirement.status) {
      await logActivity(requirement.projectId.toString(), userId, `Requirement status changed from ${requirement.status} to ${body.status}`, "requirement");
      requirement.status = body.status;
    }

    if (body.title && role === "admin") requirement.title = body.title;
    if (body.description && role === "admin") requirement.description = body.description;

    await requirement.save();

    const updatedReq = await Requirement.findById(params.id)
      .populate("addedBy", "name")
      .populate("developerLogs.developer", "name avatar");

    return NextResponse.json(updatedReq);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to update requirement" }), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  await dbConnect();

  try {
    const deleted = await Requirement.findByIdAndDelete(params.id);
    if (!deleted) return new NextResponse(JSON.stringify({ error: "Requirement not found" }), { status: 404 });
    return NextResponse.json({ message: "Requirement deleted successfully" });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to delete requirement" }), { status: 500 });
  }
}
