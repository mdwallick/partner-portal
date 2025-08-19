import { NextRequest, NextResponse } from "next/server"
import { checkPermission } from "@/lib/fga"
import { auth0ManagementAPI } from "@/lib/auth0-management"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    console.log("GET /api/partners/[id]/users/[userId] - Starting...")

    const session = await auth0.getSession()
    const user = session?.user

    const { id: partnerId, userId } = await params
    console.log("Partner ID:", partnerId, "User ID:", userId)

    // Check FGA permissions - user must have can_view permission on the partner to view user details
    console.log("🔍 Checking FGA permissions...")

    const hasViewAccess = await checkPermission(
      `user:${user?.sub}`,
      "can_view",
      `partner:${partnerId}`
    )
    console.log(`can_view permission: ${hasViewAccess}`)

    if (!hasViewAccess) {
      console.log("❌ FGA permission denied - no view access")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if user has manage_members permission for editing capabilities
    const hasManageMembersAccess = await checkPermission(
      `user:${user?.sub}`,
      "can_manage_members",
      `partner:${partnerId}`
    )
    console.log(`can_manage_members permission: ${hasManageMembersAccess}`)

    console.log("✅ FGA permission granted")

    // Get partner details
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      console.log(`Partner not found: ${partnerId}`)
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    console.log(`Found partner: ${partner.name} (${partner.id})`)

    // Get specific user details
    const partnerUser = await prisma.partnerUser.findFirst({
      where: { partner_id: partnerId, id: userId },
      include: { user: true },
    })

    if (!partnerUser) {
      console.log(`User not found: ${userId} in partner ${partnerId}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`Found user: ${partnerUser.email} (${partnerUser.id})`)

    return NextResponse.json({
      id: partnerUser.id,
      role: partnerUser.role,
      status: partnerUser.status,
      invited_at: partnerUser.invited_at,
      joined_at: partnerUser.joined_at,
      created_at: partnerUser.created_at,
      email: partnerUser.email,
      display_name: partnerUser.user?.display_name ?? null,
      auth0_user_id: partnerUser.user?.auth0_user_id ?? null,
      userCanManageMembers: hasManageMembersAccess,
    })
  } catch (error) {
    console.error("Error fetching user details:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    console.log("PUT /api/partners/[id]/users/[userId] - Starting...")

    const session = await auth0.getSession()
    const user = session?.user

    const { id: partnerId, userId } = await params
    console.log("Partner ID:", partnerId, "User ID:", userId)

    const body = await request.json()
    console.log("Request body:", body)
    const { display_name, role } = body

    // Check FGA permissions - user must have can_manage_members permission on the partner
    console.log("🔍 Checking FGA permissions...")

    const hasManageMembersAccess = await checkPermission(
      `user:${user?.sub}`,
      "can_manage_members",
      `partner:${partnerId}`
    )
    console.log(`can_manage_members permission: ${hasManageMembersAccess}`)

    if (!hasManageMembersAccess) {
      console.log("❌ FGA permission denied")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("✅ FGA permission granted")

    // Get partner details
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      console.log(`Partner not found: ${partnerId}`)
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    // Get current user details
    const currentPU = await prisma.partnerUser.findFirst({
      where: { partner_id: partnerId, id: userId },
      include: { user: true },
    })

    if (!currentPU) {
      console.log(`User not found: ${userId} in partner ${partnerId}`)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Validate role if provided
    if (role && !["can_admin", "can_manage_members", "can_view"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Database now uses the same role values as frontend
    const dbRole = role || currentPU.role

    // 1. Update Auth0 user if display_name changed
    if (display_name !== undefined && display_name !== currentPU.user?.display_name) {
      console.log(
        `Updating Auth0 user display name from "${currentPU.user?.display_name}" to "${display_name}"`
      )

      try {
        if (currentPU.user?.auth0_user_id) {
          await auth0ManagementAPI.updateUser(currentPU.user.auth0_user_id, { name: display_name })
        }
        console.log("✅ Updated Auth0 user display name")
      } catch (error) {
        console.error("❌ Failed to update Auth0 user:", error)
        return NextResponse.json({ error: "Failed to update Auth0 user" }, { status: 500 })
      }
    }

    // 2. Update FGA tuple if role changed
    if (role && role !== currentPU.role) {
      console.log(`Updating FGA tuple from ${currentPU.role} to ${role}`)

      try {
        // Import the FGA client
        const { fgaClient, getLatestAuthorizationModelId } = await import("@/lib/fga")

        const fgaRoleToDelete = currentPU.role
        console.log(`Deleting FGA tuple with role: ${fgaRoleToDelete}`)

        // Get the latest authorization model ID
        const modelId = await getLatestAuthorizationModelId()

        // Delete old tuple (use try-catch to handle case where tuple doesn't exist)
        try {
          await fgaClient.write({
            deletes: {
              tuple_keys: [
                {
                  user: `user:${currentPU.user?.auth0_user_id}`,
                  relation: fgaRoleToDelete,
                  object: `partner:${partnerId}`,
                },
              ],
            },
            authorization_model_id: modelId,
          })
          console.log("✅ Deleted old FGA tuple")
        } catch (deleteError) {
          console.error("❌ Failed to delete old FGA tuple:", deleteError)
          console.log("⚠️ Old FGA tuple not found or already deleted, continuing...")
        }

        // Write new tuple
        await fgaClient.write({
          writes: {
            tuple_keys: [
              {
                user: `user:${currentPU.user?.auth0_user_id}`,
                relation: role,
                object: `partner:${partnerId}`,
              },
            ],
          },
          authorization_model_id: modelId,
        })

        console.log("✅ Updated FGA tuple")
      } catch (error) {
        console.error("❌ Failed to update FGA tuple:", error)
        return NextResponse.json({ error: "Failed to update FGA permissions" }, { status: 500 })
      }
    }

    // 3. Update DB
    console.log("Updating DB user data...")

    try {
      // Update user display_name in users table
      if (display_name !== undefined && currentPU.user) {
        await prisma.user.update({ where: { id: currentPU.user.id }, data: { display_name } })
        console.log("✅ Updated user display_name in DB")
      }

      // Update partner_user role
      if (role) {
        await prisma.partnerUser.update({ where: { id: userId }, data: { role: dbRole as any } })
        console.log(`✅ Updated partner_user role to ${dbRole} in DB`)
      }

      console.log("✅ Successfully updated user, returning response")
      return NextResponse.json({
        message: "User updated successfully",
        updated: {
          display_name: display_name !== undefined ? display_name : currentPU.user?.display_name,
          role: role || currentPU.role,
        },
      })
    } catch (error) {
      console.error("❌ Failed to update DB:", error)
      return NextResponse.json({ error: "Failed to update database" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating user:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    console.log("DELETE /api/partners/[id]/users/[userId] - Starting...")

    const session = await auth0.getSession()
    const user = session?.user
    console.log("Authenticated user:", user)

    const { id: partnerId, userId: partnerUserId } = await params

    // Check FGA permissions - user must have can_manage_members permission on the partner
    console.log("🔍 Checking FGA permissions...")

    const hasManageMembersAccess = await checkPermission(
      `user:${user?.sub}`,
      "can_manage_members",
      `partner:${partnerId}`
    )
    console.log(`can_manage_members permission: ${hasManageMembersAccess}`)

    if (!hasManageMembersAccess) {
      console.log("❌ FGA permission denied")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("✅ FGA permission granted")

    // Get the partner user relationship and user details
    const partnerUser = await prisma.partnerUser.findFirst({
      where: { id: partnerUserId, partner_id: partnerId },
      include: { user: true },
    })

    if (!partnerUser) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    console.log(`Found user to delete: ${partnerUser.email} (${partnerUser.user?.auth0_user_id})`)

    // Prevent removing the last admin
    if (partnerUser.role === "can_admin") {
      const adminCount = await prisma.partnerUser.count({
        where: { partner_id: partnerId, role: "can_admin", status: "active" },
      })

      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 })
      }
    }

    // 1. Remove FGA tuples for the user-partner relationship
    console.log("Removing FGA tuples...")
    try {
      const { fgaClient, getLatestAuthorizationModelId } = await import("@/lib/fga")

      // Database now uses the same role values as FGA
      const fgaRoleToDelete = partnerUser.role
      console.log(`Deleting FGA tuple with role: ${fgaRoleToDelete}`)

      const modelId = await getLatestAuthorizationModelId()
      await fgaClient.write({
        deletes: {
          tuple_keys: [
            {
              user: `user:${partnerUser.user?.auth0_user_id}`,
              relation: fgaRoleToDelete,
              object: `partner:${partnerId}`,
            },
          ],
        },
        authorization_model_id: modelId,
      })

      console.log(
        `✅ Removed FGA tuple: user:${partnerUser.user?.auth0_user_id} ${fgaRoleToDelete} partner:${partnerId}`
      )
    } catch (error) {
      console.error("❌ Failed to remove FGA tuple:", error)
      // Continue with deletion even if FGA tuple removal fails
    }

    // 2. Delete the partner user relationship
    console.log("Deleting partner user relationship...")
    await prisma.partnerUser.delete({ where: { id: partnerUserId } })
    console.log("✅ Deleted partner user relationship")

    // 3. Check if user is part of other partners
    console.log(
      `Checking if Auth0 user ${partnerUser.user?.auth0_user_id} is part of other partners...`
    )
    const otherPartnerCount = await prisma.partnerUser.count({
      where: { user: { auth0_user_id: partnerUser.user?.auth0_user_id || "" } },
    })

    console.log(
      `Found ${otherPartnerCount} other partner relationships for Auth0 user ${partnerUser.user?.auth0_user_id}`
    )

    if (otherPartnerCount === 0) {
      console.log("User is not part of any other partners, deleting from Auth0 and users table...")

      // 4. Permanently delete user from Okta
      try {
        console.log(
          `Attempting to permanently delete Okta user: ${partnerUser.user?.auth0_user_id}`
        )
        if (partnerUser.user?.auth0_user_id) {
          await auth0ManagementAPI.deleteUser(partnerUser.user.auth0_user_id)
        }
        console.log("✅ Permanently deleted user from Okta")
      } catch (error) {
        console.error("❌ Failed to delete user from Okta:", error)
        // Continue with deletion even if Okta deletion fails
      }

      // 5. Delete user from users table
      if (partnerUser.user) {
        await prisma.user.delete({ where: { id: partnerUser.user.id } })
      }
      console.log("✅ Deleted user from users table")
    } else {
      console.log(`User is still part of ${otherPartnerCount} other partners, keeping user record`)
    }

    console.log("✅ Successfully deleted user")
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
