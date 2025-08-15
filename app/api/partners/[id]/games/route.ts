import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/database';
import { writeTuple } from '@/lib/fga';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;

    //console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    console.log(`🔍 Fetching games for partner: ${partnerId}`);

    // Since the user has already been authorized to view this partner (in the partner route),
    // we can directly fetch all games for this partner without additional FGA checks
    const games = await sql`
      SELECT 
        g.id,
        g.name,
        g.type,
        g.picture_url,
        g.created_at,
        g.status,
        COUNT(c.id) as client_ids_count
      FROM games g
      LEFT JOIN client_ids c ON g.id = c.game_id AND c.status = 'active'
      WHERE g.partner_id = ${partnerId}
      GROUP BY g.id, g.name, g.type, g.picture_url, g.created_at, g.status
      ORDER BY g.created_at DESC
    `;

    console.log(`🗄️  Fetched ${games.length} games for partner ${partnerId}`);
    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching partner games:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const body = await request.json();

    console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    console.log(`🔍 Creating game for partner: ${partnerId}`);

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Game name is required' }, { status: 400 });
    }

    // Verify the partner exists and is a game studio
    const partner = await sql`
      SELECT id, type FROM partners WHERE id = ${partnerId}
    `;

    if (partner.length === 0) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    if (partner[0].type !== 'game_studio') {
      return NextResponse.json({ error: 'Only game studios can have games' }, { status: 400 });
    }

    // Insert the new game into the database
    const [newGame] = await sql`
      INSERT INTO games (
        partner_id,
        name,
        type,
        picture_url,
        status
      ) VALUES (
        ${partnerId},
        ${body.name.trim()},
        ${body.genre || null},
        ${body.picture_url || null},
        'active'
      )
      RETURNING 
        id,
        partner_id,
        name,
        type,
        picture_url,
        created_at,
        status
    `;

    console.log('Created game:', newGame);

    // Create FGA tuple: partner:PARTNER_ID parent game:GAME_ID
    try {
      console.log(`Creating FGA tuple for game: ${newGame.id}`);
      
      const parentTupleCreated = await writeTuple(
        `partner:${partnerId}`,
        'parent',
        `game:${newGame.id}`
      );
      
      if (parentTupleCreated) {
        console.log(`✅ Created FGA tuple: partner:${partnerId} parent game:${newGame.id}`);
      } else {
        console.error(`❌ Failed to create FGA tuple: partner:${partnerId} parent game:${newGame.id}`);
      }
    } catch (fgaError) {
      console.error('Failed to create FGA tuple for game:', fgaError);
      // Continue with game creation even if FGA tuple creation fails
      // The game is already created in the database
    }

    return NextResponse.json(newGame, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 