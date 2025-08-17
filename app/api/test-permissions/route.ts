import { NextResponse } from "next/server"
import { checkPermission } from "@/lib/fga"
import { auth0 } from "@/lib/auth0"

export async function GET() {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = "email|687db976c6ecee58714033b3" // nico1@nicopowered.com
    const partnerId = "d87b44a4-f024-4dae-9ebd-be4c89857f7e"

    console.log(`Testing permissions for user: ${userId}`)
    console.log(`Partner ID: ${partnerId}`)

    const results = {
      userId,
      partnerId,
      permissions: {} as Record<string, boolean>,
    }

    // Test 1: Can view their assigned partner
    try {
      const canViewPartner = await checkPermission(userId, "view", `partner:${partnerId}`)
      results.permissions.canViewPartner = canViewPartner
      console.log(`✅ Can view partner ${partnerId}: ${canViewPartner}`)
    } catch (error) {
      results.permissions.canViewPartner = false
      console.log(
        `❌ Error checking partner view: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }

    // Test 2: Can manage their assigned partner (should be false)
    try {
      const canManagePartner = await checkPermission(userId, "manage", `partner:${partnerId}`)
      results.permissions.canManagePartner = canManagePartner
      console.log(`✅ Can manage partner ${partnerId}: ${canManagePartner}`)
    } catch (error) {
      results.permissions.canManagePartner = false
      console.log(
        `❌ Error checking partner manage: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }

    // Test 3: Can view a different partner (should be false)
    try {
      const canViewOtherPartner = await checkPermission(
        userId,
        "view",
        "partner:different-partner-id"
      )
      results.permissions.canViewOtherPartner = canViewOtherPartner
      console.log(`✅ Can view other partner: ${canViewOtherPartner}`)
    } catch (error) {
      results.permissions.canViewOtherPartner = false
      console.log(
        `❌ Error checking other partner view: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }

    // Test 4: Can view platform data (should be false)
    try {
      const canViewPlatform = await checkPermission(userId, "view_all", "platform:main")
      results.permissions.canViewPlatform = canViewPlatform
      console.log(`✅ Can view platform: ${canViewPlatform}`)
    } catch (error) {
      results.permissions.canViewPlatform = false
      console.log(
        `❌ Error checking platform view: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }

    console.log("---")
    console.log("Expected results:")
    console.log("- Can view assigned partner: true")
    console.log("- Can manage assigned partner: false")
    console.log("- Can view other partner: false")
    console.log("- Can view platform: false")

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error testing permissions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
