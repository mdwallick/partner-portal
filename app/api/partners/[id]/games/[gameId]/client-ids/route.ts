import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/database';
import { oktaManagementAPI } from '@/lib/okta-management';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; gameId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const gameId = params.gameId;

    //console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    console.log(`🔍 Fetching client IDs for game: ${gameId}`);

    // Verify the game exists and belongs to the partner
    const game = await sql`
      SELECT id FROM games WHERE id = ${gameId} AND partner_id = ${partnerId}
    `;

    if (game.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Fetch client IDs for this game
    const clientIds = await sql`
      SELECT 
        id,
        client_name,
        client_type,
        client_id,
        created_at,
        status
      FROM client_ids
      WHERE game_id = ${gameId}
      ORDER BY created_at DESC
    `;
    console.log(`🗄️  Fetched ${clientIds.length} client IDs for game ${gameId}`);

    return NextResponse.json(clientIds);
  } catch (error) {
    console.error('Error fetching client IDs:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; gameId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const gameId = params.gameId;
    const body = await request.json();

    console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    console.log(`🔍 Creating client ID for game: ${gameId}`);

    // Validate required fields
    if (!body.client_name || !body.client_name.trim()) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    // Validate client type - allow Android, iOS, and Web
    const allowedTypes = ['native_mobile_android', 'native_mobile_ios', 'web'];
    if (!body.client_type || !allowedTypes.includes(body.client_type)) {
      return NextResponse.json({ error: 'Client type must be either Android Native, iOS Native, or Web Application' }, { status: 400 });
    }

    // Verify the game exists and belongs to the partner
    const game = await sql`
      SELECT id, name FROM games WHERE id = ${gameId} AND partner_id = ${partnerId}
    `;

    if (game.length === 0) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Create Okta OIDC Application based on client type
    const appName = `${body.client_name.trim()} - ${game[0].name}`;
    let oktaApp;
    
    if (body.client_type === 'web') {
      oktaApp = await oktaManagementAPI.createOIDCWebApp(appName);
      console.log('🚀 Created Okta OIDC Web app:', oktaApp);
    } else {
      oktaApp = await oktaManagementAPI.createOIDCNativeApp(appName);
      console.log('🚀 Created Okta OIDC native app:', oktaApp);
    }

    // Insert the new client ID with Okta credentials
    const [newClientId] = await sql`
      INSERT INTO client_ids (
        game_id,
        client_name,
        client_type,
        client_id,
        status
      ) VALUES (
        ${gameId},
        ${body.client_name.trim()},
        ${body.client_type},
        ${oktaApp.clientId},
        'active'
      )
      RETURNING 
        id,
        game_id,
        client_name,
        client_type,
        client_id,
        created_at,
        status
    `;

    console.log('Created client ID in database:', newClientId);

    // Return the client ID with the secret for display
    return NextResponse.json({
      ...newClientId,
      clientSecret: oktaApp.clientSecret
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating client ID:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 