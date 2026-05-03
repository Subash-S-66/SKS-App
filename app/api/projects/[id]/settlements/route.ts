import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Project } from "@/models/Project";
import { ActivityLog } from "@/models/ActivityLog";
import { sendEmail } from "@/lib/email";
import { User } from "@/models/User";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const settledAmount = Number(body.settledAmount);
    const userId = body.userId;

    if (isNaN(settledAmount) || settledAmount <= 0 || !userId) {
      return Response.json({ error: "Invalid settlement data" }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findById(params.id);
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Find if settlement array already has this user
    const settlementIndex = project.settlements.findIndex(s => s.userId.toString() === userId);

    if (settlementIndex > -1) {
      project.settlements[settlementIndex].settledAmount += settledAmount;
      project.settlements[settlementIndex].settledDate = new Date();
      project.settlements[settlementIndex].settledTransactionId = body.settledTransactionId;
      project.settlements[settlementIndex].isSettled = true; // marking latest status
    } else {
      project.settlements.push({
        userId: userId,
        settledAmount: settledAmount,
        settledDate: new Date(),
        settledTransactionId: body.settledTransactionId,
        isSettled: true
      } as any);
    }

    await project.save();

    const user = await User.findById(userId);

    await ActivityLog.create({
      projectId: project._id,
      userId: session.user.id,
      action: `Settled ${project.payment.currency} ${settledAmount} for ${user?.name || "User"}`,
      type: "payment",
      metadata: { targetUser: userId, amount: settledAmount, transactionId: body.settledTransactionId }
    });

    if (user && user.email) {
      await sendEmail({
        to: user.email,
        subject: `Payment Settled: ${project.payment.currency} ${settledAmount} - ${project.clientName}`,
        html: `<p>Your share of ${project.payment.currency} ${settledAmount} has been settled for project ${project.clientName}.</p><p>Transaction ID: ${body.settledTransactionId || "N/A"}</p>`,
        projectId: project._id.toString(),
        type: "payment_settled"
      });
    }

    const updatedProject = await Project.findById(params.id)
      .populate("assignedBDE", "name role email")
      .populate("assignedDevelopers", "name role email")
      .populate("payment.transactions.recordedBy", "name")
      .populate("settlements.userId", "name role");

    return Response.json(updatedProject, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}