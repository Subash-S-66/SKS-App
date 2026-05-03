import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcrypt";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    return Response.json(users);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, username, email, password, role } = body;

    if (!name || !username || !email || !password || !role) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return Response.json({ error: "Username or email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return Response.json(userObj, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
