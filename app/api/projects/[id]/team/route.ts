import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assignedBDE, assignedDevelopers, customSplit, sharePercentages } = await req.json()
    await dbConnect()

    // Validate 100% split if custom
    if (customSplit && (assignedBDE || assignedDevelopers.length > 0)) {
        const total = (sharePercentages?.bde || 0) + (sharePercentages?.developers?.reduce((a:any, b:any) => a + b, 0) || 0)
        if (total !== 100 && (assignedBDE && assignedDevelopers.length > 0)) {
            return NextResponse.json({ error: "Total share percentage must equal 100%" }, { status: 400 })
        }
    }

    const updateData: any = {
      assignedDevelopers,
      customSplit,
      sharePercentages
    }

    // explicitly handle unset bde
    if (assignedBDE) {
        updateData.assignedBDE = assignedBDE
    } else {
        updateData.$unset = { assignedBDE: "" }
    }

    const project = await Project.findByIdAndUpdate(params.id, updateData, { new: true })
      .populate("assignedBDE", "name role")
      .populate("assignedDevelopers", "name role")

    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update team" }, { status: 500 })
  }
}
