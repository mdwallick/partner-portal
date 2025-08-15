import { NextRequest, NextResponse } from "next/server"
import { setupSuperAdmin } from "@/lib/fga-admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const result = await setupSuperAdmin(userId)

    return NextResponse.json({
      success: true,
      message: "Super admin setup completed",
      result,
    })
  } catch (error) {
    console.error("Error setting up super admin:", error)
    return NextResponse.json({ error: "Failed to setup super admin" }, { status: 500 })
  }
}
