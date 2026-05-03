import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { ActivityLog } from "@/models/ActivityLog";
import { Project } from "@/models/Project";

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

    // Auth check: Is user assigned to this project or admin?
    const project = await Project.findById(params.id);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    if (session.user.role === "bde" && project.assignedBDE.toString() !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.user.role === "developer" && !project.assignedDevelopers.some(d => d.toString() === session.user.id)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    let query: any = { projectId: params.id };
    if (type && type !== "all") {
      query.type = type;
    }

    const logs = await ActivityLog.find(query)
      .populate("userId", "name role")
      .sort({ createdAt: -1 })
      .limit(50);

    return Response.json(logs);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
