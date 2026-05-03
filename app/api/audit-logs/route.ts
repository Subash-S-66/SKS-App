import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const logs = await AuditLog.find()
      .populate("user", "name username")
      .populate("projectId", "sNo clientName companyName")
      .sort({ createdAt: -1 })
      .limit(100);

    return Response.json(logs);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
