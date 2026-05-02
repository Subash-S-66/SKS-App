import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;
    const userId = (session.user as any).id;

    if (!currentPassword || !newPassword) {
      return new NextResponse(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return new NextResponse(JSON.stringify({ error: "Incorrect current password" }), { status: 400 });
    }

    const hashedNew = await bcrypt.hash(newPassword, 12);
    user.password = hashedNew;
    user.needsPasswordChange = false;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to update password" }), { status: 500 });
  }
}
