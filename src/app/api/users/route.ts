import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const users = await User.find().select("-password").lean();

    const bdeProjects = await Project.aggregate([
      { $group: { _id: "$assignedBDE", count: { $sum: 1 } } }
    ]);

    const devProjects = await Project.aggregate([
      { $unwind: "$assignedDevelopers" },
      { $group: { _id: "$assignedDevelopers", count: { $sum: 1 } } }
    ]);

    const projectCounts = [...bdeProjects, ...devProjects].reduce((acc, curr) => {
      if (curr._id) {
        const id = curr._id.toString();
        acc[id] = (acc[id] || 0) + curr.count;
      }
      return acc;
    }, {} as Record<string, number>);

    const usersWithCounts = users.map((user) => ({
      ...user,
      projectCount: projectCounts[user._id.toString()] || 0,
    }));

    return NextResponse.json(usersWithCounts);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch users" }), { status: 500 });
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
    const { name, username, email, password, role } = body;

    if (!name || !username || !email || !password || !role) {
      return new NextResponse(JSON.stringify({ error: "All fields are required" }), { status: 400 });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return new NextResponse(JSON.stringify({ error: "Email or username already exists" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to create user" }), { status: 500 });
  }
}
