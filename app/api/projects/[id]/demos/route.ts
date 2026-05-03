import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Project } from "@/models/Project";
import { ActivityLog } from "@/models/ActivityLog";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "bde")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const project = await Project.findById(params.id);
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (session.user.role === "bde" && project.assignedBDE.toString() !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const newDemo = {
      _id: new mongoose.Types.ObjectId(),
      demoDate: new Date(body.demoDate),
      conductedBy: session.user.id,
      clientAttended: body.clientAttended,
      demoLink: body.demoLink,
      recordingLink: body.recordingLink,
      feedback: body.feedback,
      outcome: body.outcome,
      changeRequests: body.changeRequests,
      createdAt: new Date()
    };

    project.demos.push(newDemo as any);
    await project.save();

    await ActivityLog.create({
      projectId: project._id,
      userId: session.user.id,
      action: `Conducted Demo. Outcome: ${body.outcome}`,
      type: "demo",
      metadata: { demoId: newDemo._id, outcome: body.outcome }
    });

    const updatedProject = await Project.findById(params.id)
      .populate("assignedBDE", "name role")
      .populate("assignedDevelopers", "name role")
      .populate("demos.conductedBy", "name");

    return Response.json(updatedProject, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
