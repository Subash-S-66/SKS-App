import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { Project } from "@/models/Project"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await dbConnect()

    let query = {}
    if (session.user.role === "bde") {
      query = { assignedBDE: session.user.id }
    } else if (session.user.role === "developer") {
      query = { assignedDevelopers: session.user.id }
    }

    // Status aggregation
    const statusData = await Project.aggregate([
      { $match: query },
      { $group: { _id: "$status", value: { $sum: 1 } } }
    ])

    const formattedStatusData = statusData.map(item => ({
      name: item._id,
      value: item.value
    }))

    // Monthly aggregation
    const monthData = await Project.aggregate([
      { $match: query },
      { $group: { _id: "$monthForProject", total: { $sum: 1 } } },
      { $sort: { _id: 1 } } // Sort by month string (simple sort for now)
    ])

    const formattedMonthData = monthData.map(item => ({
      name: item._id,
      total: item.total
    }))

    return NextResponse.json({ statusData: formattedStatusData, monthData: formattedMonthData })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}
