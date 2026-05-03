import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Credential } from "@/models/Credential";
import { AuditLog } from "@/models/AuditLog";
import { ActivityLog } from "@/models/ActivityLog";
import { Project } from "@/models/Project";
import { encrypt, decrypt } from "@/lib/encrypt";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");
    const reveal = url.searchParams.get("reveal") === "true";

    if (!projectId) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }

    await connectDB();

    // Auth Check
    const project = await Project.findById(projectId);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    if (session.user.role === "bde" && project.assignedBDE.toString() !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (session.user.role === "developer" && !project.assignedDevelopers.some(d => d.toString() === session.user.id)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    let credential = await Credential.findOne({ projectId });

    if (!credential) {
      return Response.json(null);
    }

    const credObj = credential.toObject();

    if (reveal) {
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      await AuditLog.create({
        user: session.user.id,
        projectId,
        action: "REVEALED_CREDENTIAL",
        details: "Revealed credentials for project",
        ipAddress: ip,
      });

      if (credObj.gmailPassword) credObj.gmailPassword = decrypt(credObj.gmailPassword);
      if (credObj.hostingPassword) credObj.hostingPassword = decrypt(credObj.hostingPassword);

      if (credObj.otherCredentials) {
        credObj.otherCredentials = credObj.otherCredentials.map((c: any) => ({
          ...c,
          password: decrypt(c.password),
        }));
      }
    } else {
      // Mask passwords
      if (credObj.gmailPassword) credObj.gmailPassword = "••••••••";
      if (credObj.hostingPassword) credObj.hostingPassword = "••••••••";

      if (credObj.otherCredentials) {
        credObj.otherCredentials = credObj.otherCredentials.map((c: any) => ({
          ...c,
          password: "••••••••",
        }));
      }
    }

    return Response.json(credObj);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    if (body.gmailPassword) body.gmailPassword = encrypt(body.gmailPassword);
    if (body.hostingPassword) body.hostingPassword = encrypt(body.hostingPassword);
    if (body.otherCredentials) {
      body.otherCredentials = body.otherCredentials.map((c: any) => ({
        ...c,
        password: encrypt(c.password),
      }));
    }

    let credential = await Credential.findOne({ projectId: body.projectId });

    if (credential) {
      credential = await Credential.findOneAndUpdate({ projectId: body.projectId }, body, { new: true });
      await ActivityLog.create({
        projectId: body.projectId,
        userId: session.user.id,
        action: "Updated credentials",
        type: "credential"
      });
    } else {
      credential = await Credential.create(body);
      await ActivityLog.create({
        projectId: body.projectId,
        userId: session.user.id,
        action: "Added initial credentials",
        type: "credential"
      });
    }

    // Return masked
    const credObj = credential!.toObject();
    if (credObj.gmailPassword) credObj.gmailPassword = "••••••••";
    if (credObj.hostingPassword) credObj.hostingPassword = "••••••••";
    if (credObj.otherCredentials) {
      credObj.otherCredentials = credObj.otherCredentials.map((c: any) => ({
        ...c,
        password: "••••••••",
      }));
    }

    return Response.json(credObj, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}