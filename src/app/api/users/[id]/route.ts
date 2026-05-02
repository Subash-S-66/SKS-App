import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const updateData = { ...body };

    // Prevent user logic vulnerabilities
    delete updateData._id;

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
      updateData.needsPasswordChange = true;
    } else {
      delete updateData.password;
    }

    // Only allow checking uniqueness for email/username if they are included
    if (updateData.email || updateData.username) {
      const orConditions = [];
      if (updateData.email) orConditions.push({ email: updateData.email });
      if (updateData.username) orConditions.push({ username: updateData.username });

      const existing = await User.findOne({
        $or: orConditions,
        _id: { $ne: params.id }
      });

      if (existing) {
        return new NextResponse(JSON.stringify({ error: "Email or username already in use" }), { status: 400 });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to update user" }), { status: 500 });
  }
}
