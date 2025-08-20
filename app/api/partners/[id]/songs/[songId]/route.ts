import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPermission, deleteTuple } from "@/lib/fga"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: partnerId, songId } = await params

    // Permission: require view access to partner
    const canView = await checkPermission(`user:${user.sub}`, "can_view", `partner:${partnerId}`)
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get song with partner info
    const song = await prisma.song.findFirst({
      where: { id: songId, partner_id: partnerId },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 })

    // Check if user can admin this partner
    const canAdmin = await checkPermission(`user:${user.sub}`, "can_admin", `partner:${partnerId}`)

    return NextResponse.json({
      ...song,
      partner_id: song.partner.id,
      partner_name: song.partner.name,
      partner_type: song.partner.type,
      userCanAdmin: canAdmin,
    })
  } catch (error) {
    console.error("Error fetching song:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: partnerId, songId } = await params

    // Permission: require admin access to partner
    const canAdmin = await checkPermission(`user:${user.sub}`, "can_admin", `partner:${partnerId}`)
    if (!canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, genre, duration_s } = body

    // Validate required fields
    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Song name is required" }, { status: 400 })
    }

    // Ensure the song exists and belongs to the partner
    const existingSong = await prisma.song.findFirst({
      where: { id: songId, partner_id: partnerId },
    })
    if (!existingSong) return NextResponse.json({ error: "Song not found" }, { status: 404 })

    // Check if name is unique within the partner (excluding current song)
    const duplicateSong = await prisma.song.findFirst({
      where: {
        partner_id: partnerId,
        name: name.trim(),
        id: { not: songId },
      },
    })
    if (duplicateSong) {
      return NextResponse.json(
        { error: "A song with this name already exists for this partner" },
        { status: 400 }
      )
    }

    // Update the song
    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: {
        name: name.trim(),
        genre: genre?.trim() || null,
        duration_s: duration_s ? parseInt(duration_s) : null,
      },
    })

    return NextResponse.json(updatedSong)
  } catch (error) {
    console.error("Error updating song:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; songId: string }> }
) {
  try {
    const session = await auth0.getSession()
    const user = session?.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id: partnerId, songId } = await params

    // Permission: require manage members or admin to delete content
    const canManage = await checkPermission(
      `user:${user.sub}`,
      "can_manage_members",
      `partner:${partnerId}`
    )
    const canAdmin = await checkPermission(`user:${user.sub}`, "can_admin", `partner:${partnerId}`)
    if (!canManage && !canAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Ensure the song exists and belongs to the partner
    const song = await prisma.song.findFirst({ where: { id: songId, partner_id: partnerId } })
    if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 })

    await prisma.song.delete({ where: { id: songId } })
    await deleteTuple(`song:${songId}`, "parent", `partner:${partnerId}`)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting song:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
