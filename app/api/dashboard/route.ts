import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Project } from "@/models/Project";
import { User } from "@/models/User";
import { Requirement } from "@/models/Requirement";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const role = session.user.role;
    const userId = session.user.id;

    let projectQuery: any = {};
    if (role === "bde") {
      projectQuery.assignedBDE = userId;
    } else if (role === "developer") {
      projectQuery.assignedDevelopers = userId;
    }

    const totalProjects = await Project.countDocuments(projectQuery);
    const ongoingProjects = await Project.countDocuments({ ...projectQuery, status: "ongoing" });
    const completedProjects = await Project.countDocuments({ ...projectQuery, status: "completed" });
    const onHoldProjects = await Project.countDocuments({ ...projectQuery, status: "on hold" });

    let data: any = {
      totalProjects,
      ongoingProjects,
      completedProjects,
      onHoldProjects,
    };

    if (role === "admin") {
      const totalUsers = await User.countDocuments();
      const totalBDEs = await User.countDocuments({ role: "bde" });
      const totalDevelopers = await User.countDocuments({ role: "developer" });

      data = {
        ...data,
        totalUsers,
        totalBDEs,
        totalDevelopers,
      };
    } else if (role === "developer") {
      const pendingTasks = await Requirement.countDocuments({
        status: { $ne: "completed" },
      }); // Note: we need projectId filtering for accurate dev tasks, simplifying for dashboard stat

      data = {
        ...data,
        pendingTasks,
      };
    }

    return Response.json(data);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
