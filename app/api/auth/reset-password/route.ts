import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { User } from "@/models/User"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json()
    if (!email || !otp || !newPassword) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await dbConnect()

    const user = await User.findOne({ email })
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    if (new Date() > user.resetTokenExpiry) {
        return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
    }

    const hashedInputOtp = crypto.createHash('sha256').update(otp).digest('hex')
    if (hashedInputOtp !== user.resetToken) {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.needsPasswordChange = false; // Reset this flag since they just changed it

    await user.save();

    return NextResponse.json({ message: "Password reset successful" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
