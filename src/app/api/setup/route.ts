import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  if (process.env.BUILD_PHASE) return NextResponse.json({ message: "Build phase" });

  try {
    await dbConnect();

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      // Just in case the password was hashed wrong with the previous bcrypt module, let's reset it here temporarily
      const hashedPassword = await bcrypt.hash("SKSAdmin@2024", 12);
      adminExists.password = hashedPassword;
      adminExists.needsPasswordChange = true;
      await adminExists.save();

      return NextResponse.json({ message: "Admin already exists. Password reset for safety." }, { status: 200 });
    }

    // Create default admin
    const hashedPassword = await bcrypt.hash("SKSAdmin@2024", 12);

    await User.create({
      name: "Super Admin",
      username: "admin",
      email: "admin@sksagency.com",
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
