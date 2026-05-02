import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Credential from "@/models/Credential";
import Project from "@/models/Project";
import { encrypt } from "@/lib/encrypt";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return new NextResponse(JSON.stringify({ error: "Project ID is required" }), { status: 400 });
  }

  await dbConnect();

  try {
    const project = await Project.findById(projectId);
    if (!project) {
      return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "bde") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    if (role === "developer" && !project.assignedDevelopers.includes(userId)) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const credentials = await Credential.find({ projectId }).select("-password").lean();

    return NextResponse.json(credentials);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch credentials" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { projectId, type, label, username, password, provider, startDate, freeDays, customDomain, domainName, domainExpiryDate } = body;

    const encryptedPassword = password ? encrypt(password) : undefined;

    const newCredential = await Credential.create({
      projectId,
      type,
      label,
      username,
      password: encryptedPassword,
      provider,
      startDate,
      freeDays,
      customDomain,
      domainName,
      domainExpiryDate,
    });

    const credResponse = newCredential.toObject();
    delete credResponse.password;

    return NextResponse.json(credResponse, { status: 201 });
  } catch (error) {
    console.error("Failed to create credential", error);
    return new NextResponse(JSON.stringify({ error: "Failed to create credential" }), { status: 500 });
  }
}
