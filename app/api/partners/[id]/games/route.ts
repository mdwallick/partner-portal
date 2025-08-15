import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeTuple } from "@/lib/fga"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request)
    const partnerId = params.id

    console.log(`🔍 Fetching games for partner: ${partnerId}`)

    const games = await prisma.game.findMany({
      where: { partner_id: partnerId },
      orderBy: { created_at: "desc" },
      include: { client_ids: true },
    })

    const mapped = games.map(g => ({
      id: g.id,
      name: g.name,
      type: g.type,
      picture_url: g.picture_url,
      created_at: g.created_at,
      status: g.status,
      client_ids_count: g.client_ids.filter(c => c.status === "active").length,
    }))

    console.log(`🗄️  Fetched ${mapped.length} games for partner ${partnerId}`)
    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Error fetching partner games:", error)
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

    console.log(`🔍 Creating game for partner: ${partnerId}`)

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Game name is required" }, { status: 400 })
    }

    // Verify the partner exists and is a game studio
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } })

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    if (partner.type !== "game_studio") {
      return NextResponse.json({ error: "Only game studios can have games" }, { status: 400 })
    }

    // Insert the new game into the database
    const newGame = await prisma.game.create({
      data: {
        partner_id: partnerId,
        name: body.name.trim(),
        type: body.genre || null,
        picture_url: body.picture_url || null,
        status: "active",
      },
    })

    console.log("Created game:", newGame)

    // Create FGA tuple: partner:PARTNER_ID parent game:GAME_ID
    try {
      console.log(`Creating FGA tuple for game: ${newGame.id}`)
      const parentTupleCreated = await writeTuple(
        `partner:${partnerId}`,
        "parent",
        `game:${newGame.id}`
      )
      if (parentTupleCreated) {
        console.log(`✅ Created FGA tuple: partner:${partnerId} parent game:${newGame.id}`)
      } else {
        console.error(
          `❌ Failed to create FGA tuple: partner:${partnerId} parent game:${newGame.id}`
        )
      }
    } catch (fgaError) {
      console.error("Failed to create FGA tuple for game:", fgaError)
    }

    return NextResponse.json(newGame, { status: 201 })
  } catch (error) {
    console.error("Error creating game:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
