import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Project } from "@/models/Project";
import { ActivityLog } from "@/models/ActivityLog";
import { sendEmail } from "@/lib/email";
import mongoose from "mongoose";

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
    const amount = Number(body.amount);

    if (isNaN(amount) || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findById(params.id);
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const transaction = {
      _id: new mongoose.Types.ObjectId(),
      amount,
      type: body.type,
      paidDate: new Date(body.paidDate),
      transactionId: body.transactionId,
      paymentMethod: body.paymentMethod,
      note: body.note,
      recordedBy: session.user.id,
      createdAt: new Date()
    };

    project.payment.transactions.push(transaction as any);

    // Recalculate totals
    project.payment.amountReceived += amount;
    project.payment.amountPending = Math.max(0, project.payment.totalAmount - project.payment.amountReceived);
    project.payment.isFullyPaid = project.payment.amountPending === 0;

    if (project.payment.isFullyPaid) {
      project.payment.paymentStatus = 'fully_paid';
    } else if (project.payment.amountReceived > 0) {
      project.payment.paymentStatus = 'partially_paid';
    }

    await project.save();

    await ActivityLog.create({
      projectId: project._id,
      userId: session.user.id,
      action: `Recorded ${body.type} payment: ${project.payment.currency} ${amount}`,
      type: "payment",
      metadata: { transactionId: transaction._id, amount, method: body.paymentMethod }
    });

    // Send emails
    const populatedProject = await Project.findById(project._id)
      .populate("assignedBDE", "name email")
      .populate("assignedDevelopers", "name email");

    if (populatedProject) {
      const emails: string[] = [];
      if ((populatedProject.assignedBDE as any)?.email) emails.push((populatedProject.assignedBDE as any).email);
      populatedProject.assignedDevelopers.forEach(dev => {
        if ((dev as any).email) emails.push((dev as any).email);
      });

      for (const email of emails) {
        await sendEmail({
          to: email,
          subject: `Payment Received: ${project.payment.currency} ${amount} for ${project.clientName}`,
          html: `<p>A payment of ${project.payment.currency} ${amount} has been received for project ${project.clientName}.</p><p>Total Received: ${project.payment.currency} ${project.payment.amountReceived}</p><p>Pending: ${project.payment.currency} ${project.payment.amountPending}</p>`,
          projectId: project._id.toString(),
          type: "payment_received"
        });
      }
    }

    return Response.json(populatedProject, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
