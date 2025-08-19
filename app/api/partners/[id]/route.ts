import { NextRequest, NextResponse } from "next/server"
import { checkPermission, deleteTuples } from "@/lib/fga"
import { auth0ManagementAPI } from "@/lib/auth0-management"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: partnerId } = await params

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`✅❓ FGA check: is user ${user?.sub} related to partner ${partnerId} as can_view?`)

    // Check if user has platform-level super admin access
    const user_can_view = await checkPermission(
      `user:${user?.sub}`,
      "can_view",
      `partner:${partnerId}`
    )
    console.log(user_can_view)

    console.log(
      `✅❓ FGA check: is user ${user?.sub} related to partner ${partnerId} as can_manage_members?`
    )
    const user_can_manage_members = await checkPermission(
      `user:${user?.sub}`,
      "can_manage_members",
      `partner:${partnerId}`
    )
    console.log(user_can_manage_members)

    console.log(
      `✅❓ FGA check: is user ${user?.sub} related to partner ${partnerId} as can_admin?`
    )
    const user_can_admin = await checkPermission(
      `user:${user?.sub}`,
      "can_admin",
      `partner:${partnerId}`
    )
    console.log(user_can_admin)

    if (!user_can_view) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    // Return partner data with permission status
    return NextResponse.json({
      ...partner,
      userCanView: user_can_view,
      userCanAdmin: user_can_admin,
      userCanManageMembers: user_can_manage_members,
    })
  } catch (error) {
    console.error("Error fetching partner:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: partnerId } = await params
    const body = await request.json()
    const { name, logo_url } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Get the current partner to check if name changed and get the organization_id
    const currentPartner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!currentPartner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    const partnerData = currentPartner
    const nameChanged = partnerData.name !== name

    // Update the partner in the database
    const updatedPartner = await prisma.partner.update({
      where: { id: partnerId },
      data: { name, logo_url: logo_url || null },
    })

    // Update the Okta group if the name changed and we have an organization_id
    if (nameChanged && partnerData.organization_id) {
      try {
        const newGroupName = `Partner: ${name} (${partnerId})`
        const newGroupDescription = `Group for all members of Partner ${name} (${partnerId})`

        await auth0ManagementAPI.updateOrganization(partnerData.organization_id, {
          name: newGroupName,
          display_name: newGroupDescription,
        })
      } catch (oktaError) {
        console.error("Error updating Okta group:", oktaError)
        // Continue with the update even if Okta group update fails
        // The partner is already updated in the database
      }
    }

    return NextResponse.json(updatedPartner)
  } catch (error) {
    console.error("Error updating partner:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: partnerId } = await params

    // Check if user has platform-level super admin access
    const hasSuperAdminAccess = await checkPermission(
      `user:${user?.sub}`,
      "super_admin",
      "platform:main"
    )

    if (!hasSuperAdminAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // First, get the partner details to find the org/group ID
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    const partnerData = partner
    console.log(`Deleting partner: ${partnerData.name} (${partnerId})`)

    // Collect partner users before deletion for FGA cleanup
    const partnerUsers = await prisma.partnerUser.findMany({
      where: { partner_id: partnerId },
      select: { user_id: true, role: true },
    })

    // Delete the partner from the database
    await prisma.partner.delete({ where: { id: partnerId } })

    console.log(`✅ Deleted partner from database: ${partnerData.name}`)

    // Delete the Auth0 organization if it exists
    if (partnerData.organization_id) {
      try {
        console.log(`Deleting Okta group: ${partnerData.organization_id}`)
        await auth0ManagementAPI.deleteOrganization(partnerData.organization_id)
        console.log(`✅ Deleted organization: ${partnerData.organization_id}`)
      } catch (oktaError) {
        console.error("Failed to delete organization:", oktaError)
        // Continue with the deletion even if Okta group deletion fails
        // The partner is already deleted from the database
      }
    } else {
      console.log("No org ID found, skipping deletion")
    }

    // Clean up FGA tuples for this partner
    try {
      console.log(`Cleaning up FGA tuples for partner: ${partnerId}`)

      const tuplesToDelete: Array<{ user: string; relation: string; object: string }> = []

      // Add tuples for each partner user
      for (const partnerUser of partnerUsers) {
        // Map stored role to FGA relation (schema uses can_admin | can_manage_members | can_view)
        const fgaRelation = partnerUser.role
        tuplesToDelete.push({
          user: `user:${partnerUser.user_id}`,
          relation: fgaRelation,
          object: `partner:${partnerId}`,
        })
      }

      if (tuplesToDelete.length > 0) {
        console.log(`Deleting ${tuplesToDelete.length} FGA tuples:`, tuplesToDelete)
        await deleteTuples(tuplesToDelete)
        console.log(`✅ Deleted ${tuplesToDelete.length} FGA tuples`)
      } else {
        console.log("No FGA tuples found to delete")
      }
    } catch (fgaError) {
      console.error("Failed to clean up FGA tuples:", fgaError)
      // Continue with the deletion even if FGA cleanup fails
    }

    return NextResponse.json({ message: "Partner deleted successfully" })
  } catch (error) {
    console.error("Error deleting partner:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
