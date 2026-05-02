import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import { User } from "@/models/User"
import { sendEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 })

    await dbConnect()

    const user = await User.findOne({ email })
    if (!user) {
        // Return 200 even if not found to prevent email enumeration
        return NextResponse.json({ message: "If an account exists, an email will be sent." })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash the OTP before saving to DB
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex')

    user.resetToken = hashedOtp;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    await user.save();

    await sendEmail({
        to: user.email,
        subject: "SKS Agency - Password Reset OTP",
        html: `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Here is your One-Time Password (OTP):</p>
            <h1 style="letter-spacing: 5px; font-size: 32px; background: #f4f4f4; padding: 10px; display: inline-block;">${otp}</h1>
            <p>This OTP is valid for 15 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        `,
        type: 'password_reset'
    });

    return NextResponse.json({ message: "If an account exists, an email will be sent." })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
