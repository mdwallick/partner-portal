import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/database';
import { checkPermission } from '@/lib/fga';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; gameId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const gameId = params.gameId;

    console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    console.log(`✅❓ FGA check: is user ${user.sub} related to game ${gameId} as can_admin?`);

    // Only check can_admin permission - this is the only FGA check needed
    const user_can_admin = await checkPermission(
      `user:${user.sub}`,
      'can_admin',
      `game:${gameId}`
    );
    console.log(user_can_admin);

    if (!user_can_admin) {
      console.log(`❌ User ${user.sub} is not authorized to admin game ${gameId}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log(`✔ User ${user.sub} is authorized to admin game ${gameId}`);

    // Fetch minimal data needed: partner name and game name
    const gameData = await sql`
      SELECT 
        g.id as game_id,
        g.name as game_name,
        p.id as partner_id,
        p.name as partner_name
      FROM games g
      JOIN partners p ON g.partner_id = p.id
      WHERE g.id = ${gameId} AND g.partner_id = ${partnerId}
    `;

    if (gameData.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Return minimal data needed for the new client ID page
    return NextResponse.json({
      game: {
        id: gameData[0].game_id,
        name: gameData[0].game_name
      },
      partner: {
        id: gameData[0].partner_id,
        name: gameData[0].partner_name
      }
    });
  } catch (error) {
    console.error('Error fetching new client ID page data:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 