import { NextRequest, NextResponse } from 'next/server';
import { sql, generateId } from '@/lib/database';
import { checkPermission, deleteTuples } from '@/lib/fga';
import { requireAuth } from '@/lib/auth';
import { oktaManagementAPI } from '@/lib/okta-management';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {


    const authHeader = request.headers.get('authorization');
    //console.log('🔐 Authorization header received:', authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      //console.log('🔐 Access token received:', accessToken.substring(0, 20) + '...');
    } else {
      //console.log('🔐 No Authorization header or Bearer token found');
    }
    







    const user = await requireAuth(request);
    const partnerId = params.id;
    console.log(`✅❓ FGA check: is user ${user.sub} related to partner ${partnerId} as can_view?`);

    // Check if user has platform-level super admin access
    const user_can_view = await checkPermission(
      `user:${user.sub}`,
      'can_view',
      `partner:${partnerId}`
    );
    console.log(user_can_view);



    console.log(`✅❓ FGA check: is user ${user.sub} related to partner ${partnerId} as can_manage_members?`);
    const user_can_manage_members = await checkPermission(
      `user:${user.sub}`,
      'can_manage_members',
      `partner:${partnerId}`
    );
    console.log(user_can_manage_members);

    console.log(`✅❓ FGA check: is user ${user.sub} related to partner ${partnerId} as can_admin?`);
    const user_can_admin = await checkPermission(
      `user:${user.sub}`,
      'can_admin',
      `partner:${partnerId}`
    );
    console.log(user_can_admin);

    if (!user_can_view) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const partners = await sql`
      SELECT * FROM partners WHERE id = ${partnerId}
    `;

    if (partners.length === 0) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Return partner data with permission status
    return NextResponse.json({
      ...partners[0],
      userCanView: user_can_view,
      userCanAdmin: user_can_admin,
      userCanManageMembers: user_can_manage_members
    });
  } catch (error) {
    console.error('Error fetching partner:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
    const body = await request.json();
    const { name, logo_url } = body;



    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get the current partner to check if name changed and get the organization_id
    const currentPartner = await sql`
      SELECT * FROM partners WHERE id = ${partnerId}
    `;

    if (currentPartner.length === 0) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partnerData = currentPartner[0];
    const nameChanged = partnerData.name !== name;

    // Update the partner in the database
    const updatedPartner = await sql`
      UPDATE partners 
      SET name = ${name}, logo_url = ${logo_url || null}
      WHERE id = ${partnerId}
      RETURNING *
    `;

    if (updatedPartner.length === 0) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Update the Okta group if the name changed and we have an organization_id
    if (nameChanged && partnerData.organization_id) {
      try {
        const newGroupName = `Partner: ${name} (${partnerId})`;
        const newGroupDescription = `Group for all members of Partner ${name} (${partnerId})`;
        
        await oktaManagementAPI.updateGroup(partnerData.organization_id, newGroupName, newGroupDescription);
      } catch (oktaError) {
        console.error('Error updating Okta group:', oktaError);
        // Continue with the update even if Okta group update fails
        // The partner is already updated in the database
      }
    }

    return NextResponse.json(updatedPartner[0]);
  } catch (error) {
    console.error('Error updating partner:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;

    // Check if user has platform-level super admin access
    const hasSuperAdminAccess = await checkPermission(
      `user:${user.sub}`,
      'super_admin',
      'platform:main'
    );

    if (!hasSuperAdminAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First, get the partner details to find the Auth0 organization ID
    const partner = await sql`
      SELECT * FROM partners WHERE id = ${partnerId}
    `;

    if (partner.length === 0) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partnerData = partner[0];
    console.log(`Deleting partner: ${partnerData.name} (${partnerId})`);

    // Delete the partner from the database
    const deletedPartner = await sql`
      DELETE FROM partners WHERE id = ${partnerId} RETURNING *
    `;

    console.log(`✅ Deleted partner from database: ${partnerData.name}`);

    // Delete the Auth0 organization if it exists
    if (partnerData.organization_id) {
      try {
        console.log(`Deleting Okta group: ${partnerData.organization_id}`);
        await oktaManagementAPI.deleteOrganization(partnerData.organization_id);
        console.log(`✅ Deleted Okta group: ${partnerData.organization_id}`);
      } catch (oktaError) {
        console.error('Failed to delete Okta group:', oktaError);
        // Continue with the deletion even if Okta group deletion fails
        // The partner is already deleted from the database
      }
    } else {
      console.log('No Okta group ID found, skipping Okta deletion');
    }

    // Clean up FGA tuples for this partner
    try {
      console.log(`Cleaning up FGA tuples for partner: ${partnerId}`);
      
      // Get all partner users to clean up their FGA tuples
      const partnerUsers = await sql`
        SELECT user_id, role FROM partner_users WHERE partner_id = ${partnerId}
      `;
      
      const tuplesToDelete: Array<{ user: string; relation: string; object: string }> = [];
      
      // Add tuples for each partner user
      for (const partnerUser of partnerUsers) {
        // Map frontend roles to FGA relations
        let fgaRelation: string;
        switch (partnerUser.role) {
          case 'partner_admin':
            fgaRelation = 'can_admin';
            break;
          case 'partner_user':
            fgaRelation = 'can_manage_members';
            break;
          case 'partner_viewer':
            fgaRelation = 'can_view';
            break;
          default:
            fgaRelation = 'can_view';
        }
        
        tuplesToDelete.push({
          user: `user:${partnerUser.user_id}`,
          relation: fgaRelation,
          object: `partner:${partnerId}`
        });
      }
      
      if (tuplesToDelete.length > 0) {
        console.log(`Deleting ${tuplesToDelete.length} FGA tuples:`, tuplesToDelete);
        await deleteTuples(tuplesToDelete);
        console.log(`✅ Deleted ${tuplesToDelete.length} FGA tuples`);
      } else {
        console.log('No FGA tuples found to delete');
      }
    } catch (fgaError) {
      console.error('Failed to clean up FGA tuples:', fgaError);
      // Continue with the deletion even if FGA cleanup fails
    }

    return NextResponse.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}