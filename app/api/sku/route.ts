import { NextRequest, NextResponse } from 'next/server';
import { sql, generateId } from '@/lib/database';
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

    // Get SKUs for user's partner
    const skus = await sql`
      SELECT * FROM skus 
      WHERE partner_id = (
        SELECT partner_id FROM users WHERE id = ${userRecord.id}
      )
      ORDER BY created_at DESC
    `;

    return NextResponse.json(skus);
  } catch (error) {
    console.error('Error fetching SKUs:', error);
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
    const { name, category, series, product_image_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'SKU name is required' }, { status: 400 });
    }

    // Get user's partner
    const users = await sql`
      SELECT * FROM users WHERE auth0_user_id = ${user.sub}
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRecord = users[0];

    // Check if user's partner is a merch supplier
    const partners = await sql`
      SELECT * FROM partners WHERE id = (
        SELECT partner_id FROM users WHERE id = ${userRecord.id}
      ) AND type = 'merch_supplier'
    `;

    if (partners.length === 0) {
      return NextResponse.json({ error: 'Only merch suppliers can create SKUs' }, { status: 403 });
    }

    const partner = partners[0];

    // Create SKU
    const skuId = generateId();
    const newSku = await sql`
      INSERT INTO skus (id, partner_id, name, category, series, product_image_url)
      VALUES (${skuId}, ${partner.id}, ${name}, ${category || null}, ${series || null}, ${product_image_url || null})
      RETURNING *
    `;

    // Create FGA tuple for SKU ownership
    await checkPermission(
      `partner:${partner.id}`,
      'supplier',
      `sku:${skuId}`
    );

    return NextResponse.json(newSku[0]);
  } catch (error) {
    console.error('Error creating SKU:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 