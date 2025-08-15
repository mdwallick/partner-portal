import { NextRequest, NextResponse } from 'next/server';
import { generateId, generateClientId } from '@/lib/database';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/fga';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);

        // Get user's active partner assignments via PartnerUser
        const userRecord = await prisma.user.findUnique({
            where: { auth0_user_id: user.sub },
            include: { partnerUsers: true }
        });

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const activePartnerIds = userRecord.partnerUsers
            .filter(pu => pu.status === 'active')
            .map(pu => pu.partner_id);

        if (activePartnerIds.length === 0) {
            return NextResponse.json([]);
        }

        // Get games for user's active partners
        const games = await prisma.game.findMany({
            where: { partner_id: { in: activePartnerIds } },
            orderBy: { created_at: 'desc' },
            include: { client_ids: true }
        });

        const gamesWithCount = games.map(g => ({ ...g, client_count: g.client_ids.filter(c => c.status === 'active').length }));
        return NextResponse.json(gamesWithCount);
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

        // Get user's active partner assignments via PartnerUser
        const userRecord = await prisma.user.findUnique({
            where: { auth0_user_id: user.sub },
            include: { partnerUsers: true }
        });

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Choose a partner assigned to the user that is a game studio
        const activePartnerIds = userRecord.partnerUsers
            .filter(pu => pu.status === 'active')
            .map(pu => pu.partner_id);

        const partner = await prisma.partner.findFirst({ where: { id: { in: activePartnerIds }, type: 'game_studio' } });
        if (!partner) {
            return NextResponse.json({ error: 'Only game studios can create games' }, { status: 403 });
        }

        // Create game
        const gameId = generateId();
        const newGame = await prisma.game.create({
            data: {
                id: gameId,
                partner_id: partner.id,
                name,
                type: type || null,
                picture_url: picture_url || null
            }
        });

        // Create initial client ID
        const clientId = generateClientId();
        await prisma.clientId.create({
            data: {
                game_id: gameId,
                client_name: 'Default Client',
                client_type: 'web',
                client_id: clientId
            }
        });

        // Create FGA tuple for game ownership
        await checkPermission(
            `partner:${partner.id}`,
            'owner',
            `game:${gameId}`
        );

        return NextResponse.json({ ...newGame, client_id: clientId });
    } catch (error) {
        console.error('Error creating game:', error);
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 