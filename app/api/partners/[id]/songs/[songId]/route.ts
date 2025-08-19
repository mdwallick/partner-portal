import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth0 } from "@/lib/auth0"
import { checkPermission, deleteTuple } from "@/lib/fga"

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
