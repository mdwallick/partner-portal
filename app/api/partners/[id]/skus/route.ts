import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request)
    const partnerId = params.id

    // Fetch SKUs from database
    const skus = await prisma.sku.findMany({
      where: { partner_id: partnerId },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(skus)
  } catch (error) {
    console.error("Error fetching partner SKUs:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request)
    const partnerId = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    }

    // Verify the partner exists and is a merch supplier
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    if (partner.type !== "merch_supplier") {
      return NextResponse.json(
        { error: "Only merchandise suppliers can have products" },
        { status: 400 }
      )
    }

    // Insert the new product into the database
    const newProduct = await prisma.sku.create({
      data: {
        partner_id: partnerId,
        name: body.name.trim(),
        category: body.category || null,
        product_image_url: body.image_url || null,
        status: body.status || "active",
      },
    })

    console.log("Created product:", newProduct)

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
