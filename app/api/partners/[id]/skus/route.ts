import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;

    // Fetch SKUs from database
    const skus = await sql`
      SELECT 
        id,
        name,
        category,
        series,
        product_image_url,
        created_at,
        status
      FROM skus
      WHERE partner_id = ${partnerId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(skus);
  } catch (error) {
    console.error('Error fetching partner SKUs:', error);
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

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    // Verify the partner exists and is a merch supplier
    const partner = await sql`
      SELECT id, type FROM partners WHERE id = ${partnerId}
    `;

    if (partner.length === 0) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    if (partner[0].type !== 'merch_supplier') {
      return NextResponse.json({ error: 'Only merchandise suppliers can have products' }, { status: 400 });
    }

    // Insert the new product into the database
    const [newProduct] = await sql`
      INSERT INTO skus (
        partner_id,
        name,
        category,
        product_image_url,
        status
      ) VALUES (
        ${partnerId},
        ${body.name.trim()},
        ${body.category || null},
        ${body.image_url || null},
        ${body.status || 'active'}
      )
      RETURNING 
        id,
        partner_id,
        name,
        category,
        product_image_url,
        created_at,
        status
    `;

    console.log('Created product:', newProduct);

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 