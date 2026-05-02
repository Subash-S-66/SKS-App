import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const project = await Project.findById(params.id)
      .populate("assignedBDE", "name email role")
      .populate("assignedDevelopers", "name email role")
      .lean();

    if (!project) {
      return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "bde" && project.assignedBDE?.toString() !== userId) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    if (
      role === "developer" &&
      !project.assignedDevelopers.some((dev: any) => dev._id.toString() === userId)
    ) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch project" }), { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();

    if (body.assignedDevelopers) {
      let devIds = [];
      if (Array.isArray(body.assignedDevelopers)) {
        devIds = body.assignedDevelopers.slice(0, 2);
      } else {
        devIds = [body.assignedDevelopers];
      }

      body.assignedDevelopers = devIds;

      let devShares: number[] = [];
      if (devIds.length === 1) {
        devShares = [80];
      } else if (devIds.length === 2) {
        devShares = [40, 40];
      }

      body["sharePercentages.developers"] = devShares;
    }

    if (body.status === "completed" && !body.completedDate) {
      body.completedDate = Date.now();
    } else if (body.status !== "completed") {
      body.completedDate = null;
    }

    const updatedProject = await Project.findByIdAndUpdate(params.id, body, { new: true })
      .populate("assignedBDE", "name")
      .populate("assignedDevelopers", "name");

    if (!updatedProject) {
      return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to update project" }), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const deletedProject = await Project.findByIdAndDelete(params.id);
    if (!deletedProject) {
      return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }
    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to delete project" }), { status: 500 });
  }
}
