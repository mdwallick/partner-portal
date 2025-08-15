import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json()

    // Log to server terminal
    console.log("\n\n\n\n\n")
    console.log("===============================================")
    console.log("\n")
    console.log(`🌎 User navigated to: ${pathname}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging navigation:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
