import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import ActivityLog from "@/models/ActivityLog";
import Project from "@/models/Project";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  await dbConnect();

  try {
    const project = await Project.findById(params.id);
    if (!project) return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "bde" && project.assignedBDE?.toString() !== userId) return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    if (role === "developer" && !project.assignedDevelopers.some((dev: any) => dev._id.toString() === userId)) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    let query: any = { projectId: params.id };
    if (type && type !== "all") {
        query.type = type;
    }

    const activities = await ActivityLog.find(query)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(activities);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch activities" }), { status: 500 });
  }
}
