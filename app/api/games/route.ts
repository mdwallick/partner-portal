import { NextRequest, NextResponse } from 'next/server';
import { sql, generateId, generateClientId } from '@/lib/database';
import { checkPermission } from '@/lib/fga';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get user's partner
    const users = await sql`
      SELECT * FROM users WHERE auth0_user_id = ${user.sub}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = users[0];

    // Get games for user's partner
    const games = await sql`
      SELECT g.*, COUNT(c.id) as client_count
      FROM games g
      LEFT JOIN client_ids c ON g.id = c.game_id AND c.status = 'active'
      WHERE g.partner_id = (
        SELECT partner_id FROM users WHERE id = ${userRecord.id}
      )
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `;

    return NextResponse.json(games);
  } catch (error) {
    console.error('Error fetching games:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { name, type, picture_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Game name is required' }, { status: 400 });
    }

    // Get user's partner
    const users = await sql`
      SELECT * FROM users WHERE auth0_user_id = ${user.sub}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = users[0];

    // Check if user's partner is a game studio
    const partners = await sql`
      SELECT * FROM partners WHERE id = (
        SELECT partner_id FROM users WHERE id = ${userRecord.id}
      ) AND type = 'game_studio'
    `;

    if (partners.length === 0) {
      return NextResponse.json({ error: 'Only game studios can create games' }, { status: 403 });
    }

    const partner = partners[0];

    // Create game
    const gameId = generateId();
    const newGame = await sql`
      INSERT INTO games (id, partner_id, name, type, picture_url)
      VALUES (${gameId}, ${partner.id}, ${name}, ${type || null}, ${picture_url || null})
      RETURNING *
    `;

    // Create initial client ID
    const clientId = generateClientId();
    await sql`
      INSERT INTO client_ids (game_id, client_name, client_type, client_id)
      VALUES (${gameId}, 'Default Client', 'web', ${clientId})
    `;

    // Create FGA tuple for game ownership
    await checkPermission(
      `partner:${partner.id}`,
      'owner',
      `game:${gameId}`
    );

    return NextResponse.json({
      ...newGame[0],
      client_id: clientId
    });
  } catch (error) {
    console.error('Error creating game:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 