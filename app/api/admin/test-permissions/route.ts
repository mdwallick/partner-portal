import { NextRequest, NextResponse } from "next/server"
import { checkPermission } from "@/lib/fga"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Test super admin access - this grants all platform permissions
    const superAdminAccess = await checkPermission(
      `user:${user.sub}`,
      "super_admin",
      "platform:main"
    )

    return NextResponse.json({
      user: user.sub,
      permissions: {
        super_admin: superAdminAccess,
        // These are the permissions granted by super_admin relation:
        view_all: superAdminAccess,
        manage_all: superAdminAccess,
        manage_cr_admins: superAdminAccess,
      },
    })
  } catch (error) {
    console.error("Error testing permissions:", error)
    return NextResponse.json({ error: "Failed to test permissions" }, { status: 500 })
  }
}
