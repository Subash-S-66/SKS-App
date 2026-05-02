import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"
import { User } from "@/models/User"
import { sendEmail } from "@/lib/email"
import { logActivity } from "@/lib/activity"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, settledAmount, settledDate, settledTransactionId } = await req.json()
    await dbConnect()

    const project = await Project.findById(params.id)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    project.settlements.push({
      user: userId,
      settledAmount,
      settledDate: new Date(settledDate),
      settledTransactionId
    });

    await project.save();

    const recipientUser = await User.findById(userId);

    await logActivity({
      projectId: project._id,
      userId: session.user.id,
      action: `Settled ₹${settledAmount} for ${recipientUser?.name || 'Unknown User'}`,
      type: 'payment',
      metadata: { amount: settledAmount, recipient: userId }
    });

    if (recipientUser && recipientUser.email) {
      await sendEmail({
        to: recipientUser.email,
        subject: `Payment Settled: ₹${settledAmount} - ${project.clientName}`,
        html: `
          <h3>Share Settlement Processed</h3>
          <p>An amount of <strong>₹${settledAmount}</strong> has been marked as settled for your work on <strong>${project.clientName}</strong>.</p>
          <p><strong>Transaction ID:</strong> ${settledTransactionId || 'N/A'}</p>
          <p><strong>Date:</strong> ${new Date(settledDate).toLocaleDateString()}</p>
        `,
        projectId: project._id.toString(),
        type: 'share_settled'
      });
    }

    const updated = await Project.findById(params.id)
      .populate("assignedBDE", "name role")
      .populate("assignedDevelopers", "name role");

    return NextResponse.json(updated, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record settlement" }, { status: 500 })
  }
}
