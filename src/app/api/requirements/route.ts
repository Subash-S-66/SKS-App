import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Requirement from "@/models/Requirement";
import Project from "@/models/Project";
import { sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) return new NextResponse(JSON.stringify({ error: "Project ID is required" }), { status: 400 });

  await dbConnect();

  try {
    const project = await Project.findById(projectId);
    if (!project) return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role === "bde" && project.assignedBDE?.toString() !== userId) return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    if (role === "developer" && !project.assignedDevelopers.includes(userId)) return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    const requirements = await Requirement.find({ projectId })
      .populate("addedBy", "name")
      .populate("developerLogs.developer", "name avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(requirements);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch requirements" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const { projectId, title, description } = body;
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    const project = await Project.findById(projectId).populate("assignedDevelopers", "email");
    if (!project) return new NextResponse(JSON.stringify({ error: "Project not found" }), { status: 404 });

    if (role === "bde" && project.assignedBDE?.toString() !== userId) return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    if (role === "developer" && !project.assignedDevelopers.some((d:any)=>d._id.toString()===userId)) return new NextResponse(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    const newRequirement = await Requirement.create({
      projectId,
      title,
      description,
      addedBy: userId,
    });

    const populatedReq = await Requirement.findById(newRequirement._id).populate("addedBy", "name");

    await logActivity(projectId, userId, `Added requirement: ${title}`, "requirement");

    const emails: string[] = [];
    project.assignedDevelopers.forEach((d: any) => { if (d.email) emails.push(d.email); });

    if(emails.length > 0) {
        const html = `<p>A new requirement has been added: <strong>${title}</strong></p><p>${description}</p><p><a href="${process.env.NEXTAUTH_URL}/projects/${projectId}">View Project</a></p>`;
        sendEmail(emails, `New Requirement Added: ${project.clientName}`, html, projectId, "requirement_added").catch(console.error);
    }

    return NextResponse.json(populatedReq, { status: 201 });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to create requirement" }), { status: 500 });
  }
}
