import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/database';
import { checkPermission, deleteTuple } from '@/lib/fga';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; gameId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const gameId = params.gameId;

    //console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    console.log(`✅❓ FGA check: is user ${user.sub} related to game ${gameId} as can_view?`);

    // Check FGA authorization for viewing this specific game
    const user_can_view = await checkPermission(`user:${user.sub}`, 'can_view', `game:${gameId}`);

    console.log(`✅❓ FGA check: is user ${user.sub} related to game ${gameId} as can_admin?`);
    const user_can_admin = await checkPermission(
      `user:${user.sub}`,
      'can_admin',
      `game:${gameId}`
    );
    
    if (!user_can_view) {
      console.log(`❌ User ${user.sub} is not authorized to view game ${gameId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log(`✔ User ${user.sub} is authorized to view game ${gameId}`);

    // Fetch game details with partner information from database
    const games = await sql`
      SELECT 
        g.id,
        g.name,
        g.type,
        g.picture_url,
        g.created_at,
        g.status,
        COUNT(c.id) as client_ids_count,
        p.id as partner_id,
        p.name as partner_name,
        p.type as partner_type
      FROM games g
      LEFT JOIN client_ids c ON g.id = c.game_id AND c.status = 'active'
      LEFT JOIN partners p ON g.partner_id = p.id
      WHERE g.id = ${gameId} AND g.partner_id = ${partnerId}
      GROUP BY g.id, g.name, g.type, g.picture_url, g.created_at, g.status, p.id, p.name, p.type
    `;

    if (games.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Return game data with partner info and permission status
    return NextResponse.json({
      ...games[0],
      userCanAdmin: user_can_admin
    });
  } catch (error) {
    console.error('Error fetching game:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; gameId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const gameId = params.gameId;
    const body = await request.json();

    console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    console.log(`✅ FGA check: is user ${user.sub} allowed to admin game ${gameId}?`);

    // Check FGA authorization for admin access to this specific game
    const canAdminGame = await checkPermission(`user:${user.sub}`, 'can_admin', `game:${gameId}`);
    
    if (!canAdminGame) {
      console.log(`❌ User ${user.sub} is not authorized to admin game ${gameId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log(`✅ Is user ${user.sub} related to game ${gameId} as can_admin?`);

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Game name is required' }, { status: 400 });
    }

    // Verify the game exists and belongs to the partner
    const existingGame = await sql`
      SELECT id FROM games WHERE id = ${gameId} AND partner_id = ${partnerId}
    `;

    if (existingGame.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Update the game
    const [updatedGame] = await sql`
      UPDATE games 
      SET 
        name = ${body.name.trim()},
        type = ${body.type || null},
        picture_url = ${body.picture_url || null},
        updated_at = now()
      WHERE id = ${gameId} AND partner_id = ${partnerId}
      RETURNING 
        id,
        partner_id,
        name,
        type,
        picture_url,
        created_at,
        updated_at,
        status
    `;

    console.log('Updated game:', updatedGame);

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error('Error updating game:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; gameId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const gameId = params.gameId;

    console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    console.log(`✅ FGA check: is user ${user.sub} allowed to admin game ${gameId}?`);

    // Check FGA authorization for admin access to this specific game
    const canAdminGame = await checkPermission(`user:${user.sub}`, 'can_admin', `game:${gameId}`);
    
    if (!canAdminGame) {
      console.log(`❌ User ${user.sub} is not authorized to admin game ${gameId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log(`✅ FGA check: is user ${user.sub} related to game ${gameId} as can_admin?`);

    // Verify the game exists and belongs to the partner
    const existingGame = await sql`
      SELECT id, name FROM games WHERE id = ${gameId} AND partner_id = ${partnerId}
    `;

    if (existingGame.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Delete the game (this will cascade to client_ids due to foreign key constraint)
    await sql`
      DELETE FROM games WHERE id = ${gameId} AND partner_id = ${partnerId}
    `;

    console.log('Deleted game:', existingGame[0].name);

    // Delete FGA tuple: partner:PARTNER_ID parent game:GAME_ID
    try {
      console.log(`Deleting FGA tuple for game: ${gameId}`);
      
      const parentTupleDeleted = await deleteTuple(
        `partner:${partnerId}`,
        'parent',
        `game:${gameId}`
      );
      
      if (parentTupleDeleted) {
        console.log(`✅ Deleted FGA tuple: partner:${partnerId} parent game:${gameId}`);
      } else {
        console.error(`❌ Failed to delete FGA tuple: partner:${partnerId} parent game:${gameId}`);
      }
    } catch (fgaError) {
      console.error('Failed to delete FGA tuple for game:', fgaError);
      // Continue with game deletion even if FGA tuple deletion fails
      // The game is already deleted from the database
    }

    return NextResponse.json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 