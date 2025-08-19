import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPermission, writeTuple } from "@/lib/fga"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: partnerId } = await params

    const canView = await checkPermission(`user:${user.sub}`, "can_view", `partner:${partnerId}`)
    if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 })

    const songs = await prisma.song.findMany({
      where: { partner_id: partnerId },
      orderBy: { created_at: "desc" },
    })
    return NextResponse.json(songs)
  } catch (error) {
    console.error("Error listing songs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: partnerId } = await params
    const body = await request.json()
    const { name, genre, duration_s } = body || {}

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

    // Permission: must be able to manage members or admin for this partner to create content
    const canManage = await checkPermission(
      `user:${user.sub}`,
      "can_manage_members",
      `partner:${partnerId}`
    )
    const canAdmin = await checkPermission(`user:${user.sub}`, "can_admin", `partner:${partnerId}`)
    if (!canManage && !canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Ensure partner exists and is an artist (app-level constraint)
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })
    if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    if (partner.type !== "artist") {
      return NextResponse.json(
        { error: "Songs can only be created for artist partners" },
        { status: 400 }
      )
    }

    const song = await prisma.song.create({
      data: {
        partner_id: partnerId,
        name,
        genre: genre ?? null,
        duration_s: typeof duration_s === "number" ? duration_s : null,
      },
    })

    // format of the writeTuple function is user, relation, object
    await writeTuple(`partner:${partnerId}`, "parent", `song:${song.id}`)
    console.log(`✅ Created FGA tuple: partner:${partnerId} parent song:${song.id} `)

    return NextResponse.json(song, { status: 201 })
  } catch (error) {
    console.error("Error creating song:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
