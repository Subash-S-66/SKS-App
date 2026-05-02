import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function GET() {
  if (process.env.BUILD_PHASE) return NextResponse.json({ message: "Build phase" });

  try {
    await dbConnect();

    // Check if any admin exists
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      return NextResponse.json({ message: "Admin already exists. Setup skipped." }, { status: 200 });
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash("SKSAdmin@2024", 12);

    await User.create({
      name: "Super Admin",
      username: "admin",
      email: "admin@sksagency.com", // dummy email
      password: hashedPassword,
      role: "admin",
      needsPasswordChange: true,
    });

    return NextResponse.json({ message: "Default admin created successfully." }, { status: 201 });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
