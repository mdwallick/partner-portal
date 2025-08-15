import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; skuId: string } }
) {
    try {
        const user = await requireAuth(request);
        const partnerId = params.id;
        const skuId = params.skuId;

        // Fetch SKU details from database
        const sku = await prisma.sku.findFirst({ where: { id: skuId, partner_id: partnerId } });

        if (!sku) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(sku);
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
        const existingSku = await prisma.sku.findFirst({ where: { id: skuId, partner_id: partnerId }, select: { id: true } });

        if (!existingSku) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Update the SKU
        const updatedSku = await prisma.sku.update({
            where: { id: skuId },
            data: {
                name: body.name.trim(),
                category: body.category || null,
                product_image_url: body.image_url || null,
                status: body.status || 'active'
            }
        });

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
        const existingSku = await prisma.sku.findFirst({ where: { id: skuId, partner_id: partnerId } });

        if (!existingSku) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Delete the SKU
        await prisma.sku.delete({ where: { id: skuId } });

        console.log('Deleted SKU:', existingSku.name);

        return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting SKU:', error);
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 