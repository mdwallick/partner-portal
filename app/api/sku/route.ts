import { NextRequest, NextResponse } from 'next/server';
import { generateId } from '@/lib/database';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/fga';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);

        // Get user's partner assignments
        const userRecord = await prisma.user.findUnique({ where: { auth0_user_id: user.sub }, include: { partnerUsers: true } });

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const activePartnerIds = userRecord.partnerUsers.filter(pu => pu.status === 'active').map(pu => pu.partner_id);
        if (activePartnerIds.length === 0) return NextResponse.json([]);

        const skus = await prisma.sku.findMany({ where: { partner_id: { in: activePartnerIds } }, orderBy: { created_at: 'desc' } });
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

        // Get user's partner assignments
        const userRecord = await prisma.user.findUnique({ where: { auth0_user_id: user.sub }, include: { partnerUsers: true } });

        if (!userRecord) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const activePartnerIds = userRecord.partnerUsers.filter(pu => pu.status === 'active').map(pu => pu.partner_id);
        const partner = await prisma.partner.findFirst({ where: { id: { in: activePartnerIds }, type: 'merch_supplier' } });

        if (!partner) {
            return NextResponse.json({ error: 'Only merch suppliers can create SKUs' }, { status: 403 });
        }

        // Create SKU
        const skuId = generateId();
        const newSku = await prisma.sku.create({
            data: {
                id: skuId,
                partner_id: partner.id,
                name,
                category: category || null,
                series: series || null,
                product_image_url: product_image_url || null
            }
        });

        // Create FGA tuple for SKU ownership
        await checkPermission(
            `partner:${partner.id}`,
            'supplier',
            `sku:${skuId}`
        );

        return NextResponse.json(newSku);
    } catch (error) {
        console.error('Error creating SKU:', error);
        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 