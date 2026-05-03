import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcrypt";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("+password");
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password || "");
    if (!isValid) {
      return Response.json({ error: "Incorrect current password" }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    await user.save();

    return Response.json({ message: "Password updated successfully" });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
