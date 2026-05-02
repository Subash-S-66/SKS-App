import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Credential from "@/models/Credential";
import AuditLog from "@/models/AuditLog";
import Project from "@/models/Project";
import { decrypt } from "@/lib/encrypt";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const credential = await Credential.findById(params.id);
    if (!credential) {
      return new NextResponse(JSON.stringify({ error: "Credential not found" }), { status: 404 });
    }

    const project = await Project.findById(credential.projectId);
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "bde") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    if (role === "developer" && !project?.assignedDevelopers.includes(userId)) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const decryptedPassword = decrypt(credential.password);

    await AuditLog.create({
      userId,
      projectId: credential.projectId,
      credentialId: credential._id,
      action: "password_revealed",
    });

    return NextResponse.json({ password: decryptedPassword });
  } catch (error) {
    console.error("Reveal error", error);
    return new NextResponse(JSON.stringify({ error: "Failed to reveal password" }), { status: 500 });
  }
}
