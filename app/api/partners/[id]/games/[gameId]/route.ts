import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
        const game = await prisma.game.findFirst({
            where: { id: gameId, partner_id: partnerId },
            include: { client_ids: true, partner: true }
        });

        if (!game) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Return game data with partner info and permission status
        return NextResponse.json({
            id: game.id,
            name: game.name,
            type: game.type,
            picture_url: game.picture_url,
            created_at: game.created_at,
            status: game.status,
            client_ids_count: game.client_ids.filter(c => c.status === 'active').length,
            partner_id: game.partner?.id,
            partner_name: game.partner?.name,
            partner_type: game.partner?.type,
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
        const existingGame = await prisma.game.findFirst({ where: { id: gameId, partner_id: partnerId }, select: { id: true } });

        if (!existingGame) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Update the game
        const updatedGame = await prisma.game.update({
            where: { id: gameId },
            data: {
                name: body.name.trim(),
                type: body.type || null,
                picture_url: body.picture_url || null
            }
        });

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
        const existingGame = await prisma.game.findFirst({ where: { id: gameId, partner_id: partnerId } });

        if (!existingGame) {
            return NextResponse.json({ error: 'Game not found' }, { status: 404 });
        }

        // Delete the game (this will cascade to client_ids if FK is set)
        await prisma.game.delete({ where: { id: gameId } });

        console.log('Deleted game:', existingGame.name);

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