import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { User } from "@/models/User"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    await dbConnect()
    const user = await User.findById(session.user.id)
    if (!user || !user.password) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 })
    }

    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()

    return NextResponse.json({ message: "Password updated" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
