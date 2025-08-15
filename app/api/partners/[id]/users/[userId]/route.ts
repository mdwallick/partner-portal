import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import { checkPermission } from '@/lib/fga';
import { oktaManagementAPI } from '@/lib/okta-management';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    console.log('GET /api/partners/[id]/users/[userId] - Starting...');
    
    const user = await requireAuth(request);
    //console.log('Authenticated user:', user);
    
    const partnerId = params.id;
    const userId = params.userId;
    console.log('Partner ID:', partnerId, 'User ID:', userId);

    // Check FGA permissions - user must have can_view permission on the partner to view user details
    console.log('🔍 Checking FGA permissions...');
    
    const hasViewAccess = await checkPermission(
      `user:${user.sub}`,
      'can_view',
      `partner:${partnerId}`
    );
    console.log(`can_view permission: ${hasViewAccess}`);

    if (!hasViewAccess) {
      console.log('❌ FGA permission denied - no view access');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if user has manage_members permission for editing capabilities
    const hasManageMembersAccess = await checkPermission(
      `user:${user.sub}`,
      'can_manage_members',
      `partner:${partnerId}`
    );
    console.log(`can_manage_members permission: ${hasManageMembersAccess}`);

    console.log('✅ FGA permission granted');

    // Get partner details
    const partners = await sql`
      SELECT * FROM partners WHERE id = ${partnerId}
    `;

    if (partners.length === 0) {
      console.log(`Partner not found: ${partnerId}`);
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partner = partners[0];
    console.log(`Found partner: ${partner.name} (${partner.id})`);

    // Get specific user details
    const users = await sql`
      SELECT 
        pu.id,
        pu.role,
        pu.status,
        pu.invited_at,
        pu.joined_at,
        pu.created_at,
        u.email,
        u.display_name,
        u.auth0_user_id
      FROM partner_users pu
      JOIN users u ON pu.user_id = u.id
      WHERE pu.partner_id = ${partnerId} AND pu.id = ${userId}
    `;

    if (users.length === 0) {
      console.log(`User not found: ${userId} in partner ${partnerId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = users[0];
    console.log(`Found user: ${userData.email} (${userData.id})`);

    return NextResponse.json({
      ...userData,
      userCanManageMembers: hasManageMembersAccess
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    console.log('PUT /api/partners/[id]/users/[userId] - Starting...');
    
    const user = await requireAuth(request);
    //console.log('Authenticated user:', user);
    
    const partnerId = params.id;
    const userId = params.userId;
    console.log('Partner ID:', partnerId, 'User ID:', userId);
    
    const body = await request.json();
    console.log('Request body:', body);
    const { display_name, role } = body;

    // Check FGA permissions - user must have can_manage_members permission on the partner
    console.log('🔍 Checking FGA permissions...');
    
    const hasManageMembersAccess = await checkPermission(
      `user:${user.sub}`,
      'can_manage_members',
      `partner:${partnerId}`
    );
    console.log(`can_manage_members permission: ${hasManageMembersAccess}`);

    if (!hasManageMembersAccess) {
      console.log('❌ FGA permission denied');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('✅ FGA permission granted');

    // Get partner details
    const partners = await sql`
      SELECT * FROM partners WHERE id = ${partnerId}
    `;

    if (partners.length === 0) {
      console.log(`Partner not found: ${partnerId}`);
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partner = partners[0];
    console.log(`Found partner: ${partner.name} (${partner.id})`);

    // Get current user details
    const users = await sql`
      SELECT 
        pu.id,
        pu.role as current_role,
        u.email,
        u.display_name as current_display_name,
        u.auth0_user_id
      FROM partner_users pu
      JOIN users u ON pu.user_id = u.id
      WHERE pu.partner_id = ${partnerId} AND pu.id = ${userId}
    `;

    if (users.length === 0) {
      console.log(`User not found: ${userId} in partner ${partnerId}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = users[0];
    console.log(`Found user: ${currentUser.email} (${currentUser.id})`);

    // Validate role if provided
    if (role && !['can_admin', 'can_manage_members', 'can_view'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Database now uses the same role values as frontend
    const dbRole = role || currentUser.current_role;

    // 1. Update Auth0 user if display_name changed
    if (display_name !== undefined && display_name !== currentUser.current_display_name) {
      console.log(`Updating Auth0 user display name from "${currentUser.current_display_name}" to "${display_name}"`);
      
      try {
        await oktaManagementAPI.updateUser(currentUser.auth0_user_id, { name: display_name });
        console.log('✅ Updated Auth0 user display name');
      } catch (error) {
        console.error('❌ Failed to update Auth0 user:', error);
        return NextResponse.json({ error: 'Failed to update Auth0 user' }, { status: 500 });
      }
    }

    // 2. Update FGA tuple if role changed
    if (role && role !== currentUser.current_role) {
      console.log(`Updating FGA tuple from ${currentUser.current_role} to ${role}`);
      
      try {
        // Import the FGA client
        const { fgaClient, getLatestAuthorizationModelId } = await import('@/lib/fga');
        
        const fgaRoleToDelete = currentUser.current_role;
        console.log(`Deleting FGA tuple with role: ${fgaRoleToDelete}`);
        
        // Get the latest authorization model ID
        const modelId = await getLatestAuthorizationModelId();
        
        // Delete old tuple (use try-catch to handle case where tuple doesn't exist)
        try {
          await fgaClient.write({
            deletes: {
              tuple_keys: [{
                user: `user:${currentUser.auth0_user_id}`,
                relation: fgaRoleToDelete,
                object: `partner:${partnerId}`
              }]
            },
            authorization_model_id: modelId
          });
          console.log('✅ Deleted old FGA tuple');
        } catch (deleteError) {
          console.log('⚠️ Old FGA tuple not found or already deleted, continuing...');
        }

        // Write new tuple
        await fgaClient.write({
          writes: {
            tuple_keys: [{
              user: `user:${currentUser.auth0_user_id}`,
              relation: role,
              object: `partner:${partnerId}`
            }]
          },
          authorization_model_id: modelId
        });

        console.log('✅ Updated FGA tuple');
      } catch (error) {
        console.error('❌ Failed to update FGA tuple:', error);
        return NextResponse.json({ error: 'Failed to update FGA permissions' }, { status: 500 });
      }
    }

    // 3. Update NeonDB
    console.log('Updating NeonDB user data...');
    
    try {
      // Update user display_name in users table
      if (display_name !== undefined) {
        await sql`
          UPDATE users 
          SET display_name = ${display_name}
          WHERE auth0_user_id = ${currentUser.auth0_user_id}
        `;
        console.log('✅ Updated user display_name in NeonDB');
      }

      // Update partner_user role
      if (role) {
        await sql`
          UPDATE partner_users 
          SET role = ${dbRole}
          WHERE id = ${userId}
        `;
        console.log(`✅ Updated partner_user role to ${dbRole} in NeonDB`);
      }

      console.log('✅ Successfully updated user, returning response');
      return NextResponse.json({ 
        message: 'User updated successfully',
        updated: {
          display_name: display_name !== undefined ? display_name : currentUser.current_display_name,
          role: role || currentUser.current_role
        }
      });
    } catch (error) {
      console.error('❌ Failed to update NeonDB:', error);
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    console.log('DELETE /api/partners/[id]/users/[userId] - Starting...');
    
    const user = await requireAuth(request);
    console.log('Authenticated user:', user);
    
    const partnerId = params.id;
    const partnerUserId = params.userId;

    // Check FGA permissions - user must have can_manage_members permission on the partner
    console.log('🔍 Checking FGA permissions...');
    
    const hasManageMembersAccess = await checkPermission(
      `user:${user.sub}`,
      'can_manage_members',
      `partner:${partnerId}`
    );
    console.log(`can_manage_members permission: ${hasManageMembersAccess}`);

    if (!hasManageMembersAccess) {
      console.log('❌ FGA permission denied');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('✅ FGA permission granted');

    // Get the partner user relationship and user details
    const partnerUsers = await sql`
      SELECT pu.*, u.email, u.auth0_user_id, u.id as user_id
      FROM partner_users pu
      JOIN users u ON pu.user_id = u.id
      WHERE pu.id = ${partnerUserId} AND pu.partner_id = ${partnerId}
    `;

    if (partnerUsers.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const partnerUser = partnerUsers[0];
    console.log(`Found user to delete: ${partnerUser.email} (${partnerUser.auth0_user_id})`);

    // Prevent removing the last admin
    if (partnerUser.role === 'partner_admin') {
      const adminCount = await sql`
        SELECT COUNT(*) as count
        FROM partner_users
        WHERE partner_id = ${partnerId} AND role = 'partner_admin' AND status = 'active'
      `;

      if (adminCount[0].count <= 1) {
        return NextResponse.json({ error: 'Cannot remove the last admin' }, { status: 400 });
      }
    }

    // 1. Remove FGA tuples for the user-partner relationship
    console.log('Removing FGA tuples...');
    try {
      const { fgaClient, getLatestAuthorizationModelId } = await import('@/lib/fga');
      
      // Database now uses the same role values as FGA
      const fgaRoleToDelete = partnerUser.role;
      console.log(`Deleting FGA tuple with role: ${fgaRoleToDelete}`);
      
      const modelId = await getLatestAuthorizationModelId();
      await fgaClient.write({
        deletes: {
          tuple_keys: [{
            user: `user:${partnerUser.auth0_user_id}`,
            relation: fgaRoleToDelete,
            object: `partner:${partnerId}`
          }]
        },
        authorization_model_id: modelId
      });
      
      console.log(`✅ Removed FGA tuple: user:${partnerUser.auth0_user_id} ${fgaRoleToDelete} partner:${partnerId}`);
    } catch (error) {
      console.error('❌ Failed to remove FGA tuple:', error);
      // Continue with deletion even if FGA tuple removal fails
    }

    // 2. Delete the partner user relationship
    console.log('Deleting partner user relationship...');
    await sql`
      DELETE FROM partner_users 
      WHERE id = ${partnerUserId}
    `;
    console.log('✅ Deleted partner user relationship');

    // 3. Check if user is part of other partners
    console.log(`Checking if Auth0 user ${partnerUser.auth0_user_id} is part of other partners...`);
    const otherPartners = await sql`
      SELECT COUNT(*) as count
      FROM partner_users pu
      JOIN users u ON pu.user_id = u.id
      WHERE u.auth0_user_id = ${partnerUser.auth0_user_id}
    `;

    console.log(`Found ${otherPartners[0].count} other partner relationships for Auth0 user ${partnerUser.auth0_user_id}`);
    console.log(`Count type: ${typeof otherPartners[0].count}, value: ${otherPartners[0].count}`);

    if (Number(otherPartners[0].count) === 0) {
      console.log('User is not part of any other partners, deleting from Auth0 and users table...');
      
      // 4. Permanently delete user from Okta
      try {
        console.log(`Attempting to permanently delete Okta user: ${partnerUser.auth0_user_id}`);
        await oktaManagementAPI.deleteUser(partnerUser.auth0_user_id);
        console.log('✅ Permanently deleted user from Okta');
      } catch (error) {
        console.error('❌ Failed to delete user from Okta:', error);
        // Continue with deletion even if Okta deletion fails
      }

      // 5. Delete user from users table
      await sql`
        DELETE FROM users 
        WHERE id = ${partnerUser.user_id}
      `;
      console.log('✅ Deleted user from users table');
    } else {
      console.log(`User is still part of ${otherPartners[0].count} other partners, keeping user record`);
    }

    console.log('✅ Successfully deleted user');
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 