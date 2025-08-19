import { NextRequest, NextResponse } from "next/server"
import { checkPermission, writeTuple, deleteTuple } from "@/lib/fga"
import { auth0ManagementAPI } from "@/lib/auth0-management"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"

import type { PartnerUser } from "@/lib/types"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    const { id: partnerId } = await params

    console.log(`✅❓ FGA check: is user ${user?.sub} related to partner ${partnerId} as can_view?`)

    // Check if user has can_view permission on the partner
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

    if (!user_can_view) {
      console.log(`❌ User ${user?.sub} is not authorized to view partner ${partnerId}`)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    //console.log(`✅ User ${user.sub} is authorized to view partner ${partnerId}`);

    // Get partner details to check if it has an organization
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      console.log(`Partner not found: ${partnerId}`)
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }
    console.log(`Found partner: ${partner.name} (${partner.id})`)

    // Get team members for this partner
    const partnerUsers = await prisma.partnerUser.findMany({
      where: { partner_id: partnerId },
      include: { user: true },
      orderBy: { created_at: "desc" },
    })

    // Map database roles to frontend roles for display
    const mappedTeamMembers = partnerUsers.map((pu: PartnerUser) => ({
      id: pu.id,
      partnerId: pu.partner_id,
      role: pu.role,
      status: pu.status,
      invited_at: pu.invited_at,
      joined_at: pu.joined_at,
      created_at: pu.created_at,
      email: pu.email,
      display_name: pu.display_name ?? null,
      auth0_user_id: pu.auth0_user_id ?? null,
    }))

    console.log(`Found ${mappedTeamMembers.length} team members for partner ${partnerId}`)

    // Return team members with permission status and partner data
    return NextResponse.json({
      teamMembers: mappedTeamMembers,
      partner: {
        id: partner.id,
        name: partner.name,
        type: partner.type,
      },
      userCanView: user_can_view,
      userCanManageMembers: user_can_manage_members,
    })
  } catch (error) {
    console.error("Error fetching team members:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    const { id: partnerId } = await params

    const body = await request.json()
    const { email, firstName, lastName, role = "can_view" } = body

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!firstName) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 })
    }

    if (!lastName) {
      return NextResponse.json({ error: "Last name is required" }, { status: 400 })
    }

    if (!["can_admin", "can_manage_members", "can_view"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    console.log(
      `✅❓ FGA check: is user ${user?.sub} related to partner ${partnerId} as can_manage_members?`
    )

    // Check if user has can_manage_members permission on the partner
    const user_can_manage_members = await checkPermission(
      `user:${user?.sub}`,
      "can_manage_members",
      `partner:${partnerId}`
    )

    if (!user_can_manage_members) {
      console.log(
        `❌ User ${user?.sub} is not authorized to manage members for partner ${partnerId}`
      )
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions. You need can_manage_members permission." },
        { status: 403 }
      )
    }

    //console.log(`✅ User ${user.sub} is authorized to manage members for partner ${partnerId}`);

    // Get partner details
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }
    console.log(`Found partner: ${partner.name} (${partner.id})`)

    if (!partner.organization_id) {
      return NextResponse.json({ error: "Partner organization not found" }, { status: 400 })
    }

    // 1. Create FGA tuple for the new user with the specified role FIRST
    console.log(`Creating FGA tuple for user with role ${role} on partner ${partnerId}`)

    // We'll create the FGA tuple with a temporary user ID that we'll update later
    const tempUserId = `temp_${Date.now()}`

    try {
      await writeTuple(`user:${tempUserId}`, role, `partner:${partnerId}`)
      console.log(`✅ Created FGA tuple: user:${tempUserId} ${role} partner:${partnerId}`)
    } catch (fgaError) {
      console.error("Failed to create FGA tuple:", fgaError)
      return NextResponse.json({ error: "Failed to create FGA permissions" }, { status: 500 })
    }

    // 2. Create user in Okta with proper groups and set as active
    console.log(`Creating Okta user for email: ${email} with name: ${firstName} ${lastName}`)
    let userId: string = "fixme"

    try {
      // Create user in Okta with first name and last name
      const displayName = `${firstName} ${lastName}`

      const user = await auth0ManagementAPI.createUser({
        email,
        name: displayName,
        app_metadata: {
          partner_id: partner.organization_id,
          partner_name: partner.name,
          partner_type: partner.type,
        },
        connection: process.env.AUTH0_DB_CONNECTION_ID,
      })
      userId = user.id
      console.log(`✅ Created user: ${userId} for email: ${email}`)

      // Add user to the specific partner group
      await auth0ManagementAPI.addUserToOrganization(partner.organization_id, userId)
      console.log(`✅ Added user ${userId} to partner: ${partner.organization_id}`)
    } catch (error) {
      console.error("Failed to invite user:", error)
      return NextResponse.json({ error: "Failed to invite user" }, { status: 500 })
    }

    // 3. Update the FGA tuple with the real Okta user ID
    try {
      // Delete the temporary tuple
      await deleteTuple(`user:${tempUserId}`, role, `partner:${partnerId}`)
      console.log(`✅ Deleted temporary FGA tuple: user:${tempUserId} ${role} partner:${partnerId}`)

      // Create the real tuple with the Okta user ID
      await writeTuple(`user:${userId}`, role, `partner:${partnerId}`)
      console.log(`✅ Created FGA tuple: user:${userId} ${role} partner:${partnerId}`)
    } catch (fgaError) {
      console.error("Failed to update FGA tuple:", fgaError)
      return NextResponse.json({ error: "Failed to create FGA permissions" }, { status: 500 })
    }

    // 4. Create user record in DB
    const createdUser = await prisma.user.create({
      data: {
        auth0_user_id: userId,
        email,
        display_name: `${firstName} ${lastName}`,
      },
    })
    console.log(`✅ Created DB user: ${createdUser.id}`)

    // 5. Create partner user relationship in DB (roles equal FGA values)
    const createdPU = await prisma.partnerUser.create({
      data: {
        partner_id: partnerId,
        user_id: createdUser.id,
        role: role,
        status: "pending",
        invited_by: null,
        email,
      },
    })
    console.log(`✅ Created partner user relationship: ${createdPU.id} with DB role: ${role}`)

    // Return the created team member
    const newMember = await prisma.partnerUser.findUnique({
      where: { id: createdPU.id },
      include: { user: true },
    })

    console.log("✅ Successfully created team member, returning response")
    return NextResponse.json({
      id: newMember?.id,
      role: newMember?.role,
      status: newMember?.status,
      invited_at: newMember?.invited_at,
      joined_at: newMember?.joined_at,
      created_at: newMember?.created_at,
      email: newMember?.email,
      display_name: newMember?.user?.display_name ?? null,
      auth0_user_id: newMember?.user?.auth0_user_id ?? null,
    })
  } catch (error) {
    console.error("❌ Error in POST handler:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
