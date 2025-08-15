import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sql } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; skuId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const skuId = params.skuId;

    // Fetch SKU details from database
    const skus = await sql`
      SELECT 
        id,
        name,
        category,
        series,
        product_image_url,
        created_at,
        updated_at,
        status
      FROM skus
      WHERE id = ${skuId} AND partner_id = ${partnerId}
    `;

    if (skus.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(skus[0]);
  } catch (error) {
    console.error('Error fetching SKU:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; skuId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const skuId = params.skuId;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    // Verify the SKU exists and belongs to the partner
    const existingSku = await sql`
      SELECT id FROM skus WHERE id = ${skuId} AND partner_id = ${partnerId}
    `;

    if (existingSku.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update the SKU
    const [updatedSku] = await sql`
      UPDATE skus 
      SET 
        name = ${body.name.trim()},
        category = ${body.category || null},
        product_image_url = ${body.image_url || null},
        status = ${body.status || 'active'},
        updated_at = now()
      WHERE id = ${skuId} AND partner_id = ${partnerId}
      RETURNING 
        id,
        partner_id,
        name,
        category,
        series,
        product_image_url,
        created_at,
        updated_at,
        status
    `;

    console.log('Updated SKU:', updatedSku);

    return NextResponse.json(updatedSku);
  } catch (error) {
    console.error('Error updating SKU:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; skuId: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const skuId = params.skuId;

    // Verify the SKU exists and belongs to the partner
    const existingSku = await sql`
      SELECT id, name FROM skus WHERE id = ${skuId} AND partner_id = ${partnerId}
    `;

    if (existingSku.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete the SKU
    await sql`
      DELETE FROM skus WHERE id = ${skuId} AND partner_id = ${partnerId}
    `;

    console.log('Deleted SKU:', existingSku[0].name);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting SKU:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 