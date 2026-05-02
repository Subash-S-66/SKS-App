import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { User } from "@/models/User"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()
    const users = await User.find({}).select("-password").sort({ createdAt: -1 })
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, username, email, password, role, needsPasswordChange } = await req.json()

    if (!name || !username || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await dbConnect()

    const existingUser = await User.findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role,
    })

    return NextResponse.json({ message: "User created successfully" }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 })
  }
}
