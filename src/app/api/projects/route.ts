import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    let query: any = {};

    if (status) query.status = status;

    if (role === "bde") {
      query.assignedBDE = userId;
    } else if (role === "developer") {
      query.assignedDevelopers = userId;
    }

    const projects = await Project.find(query)
      .populate("assignedBDE", "name avatar email")
      .populate("assignedDevelopers", "name avatar email")
      .sort({ sNo: -1 })
      .lean();

    return NextResponse.json(projects);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to fetch projects" }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();
  const userId = (session.user as any).id;

  try {
    const body = await req.json();
    const {
      clientName, companyName, typeOfJob, features, description, isDemoRequired,
      assignedBDE, assignedDevelopers,
      startDate, deadlineDate, expectedDeliveryDate, monthForProject, projectBudget,
      payment, demos, links
    } = body;

    let devIds = [];
    if (Array.isArray(assignedDevelopers)) {
      devIds = assignedDevelopers.slice(0, 2);
    } else if (assignedDevelopers) {
      devIds = [assignedDevelopers];
    }

    let bdeShare = 20;
    let devShares: number[] = [];

    if (devIds.length === 1) devShares = [80];
    else if (devIds.length === 2) devShares = [40, 40];

    const newProject = await Project.create({
      clientName,
      companyName,
      typeOfJob,
      features,
      description,
      isDemoRequired,
      assignedBDE: assignedBDE || undefined,
      assignedDevelopers: devIds,
      sharePercentages: { bde: bdeShare, developers: devShares },
      startDate: startDate || Date.now(),
      deadlineDate,
      expectedDeliveryDate,
      monthForProject,
      projectBudget,
      payment: payment || { totalAmount: projectBudget, currency: "INR" },
      demos: demos || [],
      links: links || { otherLinks: [] }
    });

    const populatedProject = await Project.findById(newProject._id)
      .populate("assignedBDE", "email")
      .populate("assignedDevelopers", "email");

    // Email & Activity
    await logActivity(newProject._id, userId, `Created new project: ${clientName}`, "status");

    const emails: string[] = [];
    if (populatedProject.assignedBDE?.email) emails.push(populatedProject.assignedBDE.email);
    populatedProject.assignedDevelopers.forEach((d: any) => {
      if (d.email) emails.push(d.email);
    });

    if (emails.length > 0) {
      const subject = `New Project Assigned: ${clientName} - ${companyName}`;
      const html = `<p>You have been assigned to a new project.</p><p><strong>Client:</strong> ${clientName}</p><p><strong>Type:</strong> ${typeOfJob}</p><p><a href="${process.env.NEXTAUTH_URL}/projects/${newProject._id}">Click here to view the project</a></p>`;
      // Async so we don't block
      sendEmail(emails, subject, html, newProject._id, "project_assigned").catch(console.error);
    }

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Project creation error:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to create project" }), { status: 500 });
  }
}
