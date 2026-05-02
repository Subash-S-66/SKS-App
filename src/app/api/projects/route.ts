import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (role === "bde") {
      query.assignedBDE = userId;
    } else if (role === "developer") {
      query.assignedDevelopers = userId;
    }

    const projects = await Project.find(query)
      .populate("assignedBDE", "name avatar")
      .populate("assignedDevelopers", "name avatar")
      .sort({ sNo: -1 })
      .lean();

    return NextResponse.json(projects);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch projects" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const {
      clientName, companyName, typeOfJob, features,
      assignedBDE, assignedDevelopers,
      startDate, deadlineDate, monthForProject, projectBudget
    } = body;

    let devIds = [];
    if (Array.isArray(assignedDevelopers)) {
      devIds = assignedDevelopers.slice(0, 2);
    } else if (assignedDevelopers) {
      devIds = [assignedDevelopers];
    }

    let bdeShare = 20;
    let devShares: number[] = [];

    if (devIds.length === 1) {
      devShares = [80];
    } else if (devIds.length === 2) {
      devShares = [40, 40];
    }

    const newProject = await Project.create({
      clientName,
      companyName,
      typeOfJob,
      features,
      assignedBDE: assignedBDE || undefined,
      assignedDevelopers: devIds,
      sharePercentages: {
        bde: bdeShare,
        developers: devShares,
      },
      startDate: startDate || Date.now(),
      deadlineDate,
      monthForProject,
      projectBudget,
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Project creation error:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to create project" }), { status: 500 });
  }
}
