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

    const body = await req.json()
    await dbConnect()

    const project = await Project.findById(params.id)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    project.payment.transactions.push({
      ...body,
      recordedBy: session.user.id
    });

    await project.save(); // This triggers the pre-save hook for amounts and status

    await logActivity({
      projectId: project._id,
      userId: session.user.id,
      action: `Recorded ${body.type} payment of ₹${body.amount}`,
      type: 'payment',
      metadata: { amount: body.amount, transactionId: body.transactionId }
    });

    // Notify team
    const recipients: string[] = [];
    let bdeAmount = 0;
    let devAmounts: number[] = [];

    const totalReceived = project.payment.amountReceived;
    const bdeShare = project.sharePercentages?.bde || 0;
    bdeAmount = (totalReceived * bdeShare) / 100;

    if (project.assignedBDE) {
      const bde = await User.findById(project.assignedBDE);
      if (bde) recipients.push(bde.email);
    }

    if (project.assignedDevelopers && project.assignedDevelopers.length > 0) {
       for (let i=0; i<project.assignedDevelopers.length; i++) {
          const dev = await User.findById(project.assignedDevelopers[i]);
          if (dev) {
            recipients.push(dev.email);
            devAmounts.push((totalReceived * (project.sharePercentages?.developers?.[i] || 0)) / 100);
          }
       }
    }

    if (recipients.length > 0) {
      await sendEmail({
        to: recipients,
        subject: `Payment Received: ₹${body.amount} for ${project.clientName}`,
        html: `
          <h3>Payment Update</h3>
          <p>A new payment of <strong>₹${body.amount}</strong> was recorded for <strong>${project.clientName}</strong>.</p>
          <p><strong>Total Received:</strong> ₹${project.payment.amountReceived} / ₹${project.payment.totalAmount}</p>
          <p><strong>Transaction ID:</strong> ${body.transactionId || 'N/A'}</p>
          <hr/>
          <p>Login to the dashboard to see your updated settled/pending share.</p>
        `,
        projectId: project._id.toString(),
        type: 'payment_received'
      });
    }

    const updated = await Project.findById(params.id)
      .populate("payment.transactions.recordedBy", "name")
      .populate("assignedBDE", "name role")
      .populate("assignedDevelopers", "name role");

    return NextResponse.json(updated, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 })
  }
}
