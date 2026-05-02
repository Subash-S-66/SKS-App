import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Credential from "@/models/Credential";
import { encrypt } from "@/lib/encrypt";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const updateData = { ...body };

    if (updateData.password) {
      updateData.password = encrypt(updateData.password);
    } else {
      delete updateData.password; // Don't override if not changing
    }

    if (updateData.freeDays) {
      updateData.freeDays = Number(updateData.freeDays);
    }

    const updatedCred = await Credential.findByIdAndUpdate(params.id, updateData, { new: true });

    if (!updatedCred) {
      return new NextResponse(JSON.stringify({ error: "Credential not found" }), { status: 404 });
    }

    const credResponse = updatedCred.toObject();
    delete credResponse.password;

    return NextResponse.json(credResponse);
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to update credential" }), { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== "admin") {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  await dbConnect();

  try {
    const deleted = await Credential.findByIdAndDelete(params.id);
    if (!deleted) {
      return new NextResponse(JSON.stringify({ error: "Credential not found" }), { status: 404 });
    }
    return NextResponse.json({ message: "Credential deleted successfully" });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: "Failed to delete credential" }), { status: 500 });
  }
}
