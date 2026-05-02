import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import Requirement from "@/models/Requirement";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "admin") {
      const totalProjects = await Project.countDocuments();
      const ongoing = await Project.countDocuments({ status: "ongoing" });
      const completed = await Project.countDocuments({ status: "completed" });
      const totalUsers = await User.countDocuments();
      const totalBDEs = await User.countDocuments({ role: "bde" });
      const totalDevs = await User.countDocuments({ role: "developer" });

      return NextResponse.json({
        totalProjects,
        ongoing,
        completed,
        totalUsers,
        totalBDEs,
        totalDevs,
      });
    } else if (role === "bde") {
      const projects = await Project.find({ assignedBDE: userId });
      const totalProjects = projects.length;
      const ongoing = projects.filter(p => p.status === "ongoing").length;
      const completed = projects.filter(p => p.status === "completed").length;

      return NextResponse.json({
        totalProjects,
        ongoing,
        completed,
      });
    } else if (role === "developer") {
      const projects = await Project.find({ assignedDevelopers: userId });
      const projectIds = projects.map(p => p._id);

      const totalProjects = projects.length;
      const ongoing = projects.filter(p => p.status === "ongoing").length;
      const completed = projects.filter(p => p.status === "completed").length;

      const pendingTasks = await Requirement.countDocuments({
        projectId: { $in: projectIds },
        status: "pending",
      });

      return NextResponse.json({
        totalProjects,
        ongoing,
        completed,
        pendingTasks,
      });
    }
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch dashboard stats" }), { status: 500 });
  }
}
