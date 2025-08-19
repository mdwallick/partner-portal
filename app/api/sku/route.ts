import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"
import { checkPermission } from "@/lib/fga"
import { auth0 } from "@/lib/auth0"

import type { PartnerUser } from "@/lib/types"

export async function GET() {
  try {
    const session = await auth0.getSession()
    const user = session?.user

    // Get user's partner assignments
    const userRecord = await prisma.user.findUnique({
      where: { auth0_user_id: user?.sub },
      include: { partnerUsers: true },
    })

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const activePartnerIds = userRecord.partnerUsers
      .filter((pu: PartnerUser) => pu.status === "active")
      .map((pu: PartnerUser) => pu.partner_id)
    if (activePartnerIds.length === 0) return NextResponse.json([])

    const skus = await prisma.sku.findMany({
      where: { partner_id: { in: activePartnerIds } },
      orderBy: { created_at: "desc" },
    })
    return NextResponse.json(skus)
  } catch (error) {
    console.error("Error fetching SKUs:", error)
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

    const body = await request.json()
    const { name, category, series, product_image_url } = body

    if (!name) {
      return NextResponse.json({ error: "SKU name is required" }, { status: 400 })
    }

    // Get user's partner assignments
    const userRecord = await prisma.user.findUnique({
      where: { auth0_user_id: user?.sub },
      include: { partnerUsers: true },
    })

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const activePartnerIds = userRecord.partnerUsers
      .filter((pu: PartnerUser) => pu.status === "active")
      .map((pu: PartnerUser) => pu.partner_id)
    const partner = await prisma.partner.findFirst({
      where: { id: { in: activePartnerIds }, type: "merch_supplier" },
    })

    if (!partner) {
      return NextResponse.json({ error: "Only merch suppliers can create SKUs" }, { status: 403 })
    }

    // Create SKU
    const skuId = uuidv4()
    const newSku = await prisma.sku.create({
      data: {
        id: skuId,
        partner_id: partner.id,
        name,
        category: category || null,
        series: series || null,
        product_image_url: product_image_url || null,
      },
    })

    // Create FGA tuple for SKU ownership
    await checkPermission(`partner:${partner.id}`, "supplier", `sku:${skuId}`)

    return NextResponse.json(newSku)
  } catch (error) {
    console.error("Error creating SKU:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
