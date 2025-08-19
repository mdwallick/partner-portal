import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import { checkPermission, listObjects, writeTuple } from "@/lib/fga"
import { auth0 } from "@/lib/auth0"
import { auth0ManagementAPI } from "@/lib/auth0-management"

export async function GET() {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    //console.log('TESTING AuthN');
    console.log(`🔍 Fetching partners for user: ${user?.email} (${user?.sub})`)
    console.log(`✅❗ FGA list all partner objects that ${user?.sub} is related to as can_view`)

    // Use ListObjects to get all partners the user has access to
    // This will return all partners for super admins and only accessible partners for regular users
    const accessiblePartnerIds = await listObjects(`user:${user?.sub}`, "can_view", "partner")

    console.log(
      `🗄️ FGA returned ${accessiblePartnerIds.length} partner IDs that 👤 ${user?.email} is allowed to view:`,
      accessiblePartnerIds
    )

    if (accessiblePartnerIds.length === 0) {
      console.log("No accessible partners found")
      return NextResponse.json([])
    }

    // Query database for only the accessible partners
    const partners = await prisma.partner.findMany({
      where: { id: { in: accessiblePartnerIds } },
      orderBy: { created_at: "desc" },
    })

    console.log(`🗄️ Fetched ${partners.length} partners from database`)
    return NextResponse.json(partners)
  } catch (error) {
    console.error("Error fetching partners:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    console.log(`👤 Creating partner for user: ${user?.email} (${user?.sub})`)

    // Check if user has platform-level super admin access
    const hasSuperAdminAccess = await checkPermission(
      `user:${user?.sub}`,
      "super_admin",
      "platform:main"
    )

    if (!hasSuperAdminAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    console.log("🔍 Request body:", body)
    const { name, type, logo_url } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    if (!["artist", "merch_supplier"].includes(type)) {
      return NextResponse.json({ error: "Invalid partner type" }, { status: 400 })
    }

    const partnerId = uuidv4()

    // Create group in Okta (equivalent to Auth0 Organization)
    let orgId: string | undefined
    try {
      const partner_name = `partner-${name.toLowerCase().replace(/\s+/g, "-")}`
      const display_name = `Partner ${name}`

      const org = await auth0ManagementAPI.createOrganization({
        name: partner_name,
        display_name: display_name,
        metadata: {
          partner_id: partnerId,
          partner_type: type,
        },
      })
      orgId = org.id
      console.log(`🚀 Created organization: ${orgId} (${partner_name}) for partner: ${partnerId}`)
    } catch (error) {
      console.error("Error creating Okta group:", error)
      // Continue with partner creation even if group creation fails
      // The group_id will be null in this case
    }

    const newPartner = await prisma.partner.create({
      data: {
        id: partnerId,
        name,
        type,
        organization_id: orgId || null,
        logo_url: logo_url || null,
      },
    })

    console.log(`🗄️ Created partner in database: ${name} (${partnerId})`)

    // Create FGA tuples for the new partner
    try {
      console.log(`Creating FGA tuples for partner: ${partnerId}`)

      // 1. Create parent relationship: platform:main -> partner:PARTNERID (parent)
      const parentTupleCreated = await writeTuple("platform:main", "parent", `partner:${partnerId}`)

      if (parentTupleCreated) {
        console.log(`✅ Created FGA tuple: platform:main parent partner:${partnerId}`)
      } else {
        console.error(`❌ Failed to create FGA tuple: platform:main parent partner:${partnerId}`)
      }
    } catch (fgaError) {
      console.error("Failed to create FGA tuples:", fgaError)
      // Continue with partner creation even if FGA tuple creation fails
      // The partner is already created in the database
    }

    return NextResponse.json(newPartner)
  } catch (error) {
    console.error("Error creating partner:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
