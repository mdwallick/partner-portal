import { NextRequest, NextResponse } from 'next/server';
import { sql, generateId } from '@/lib/database';
import { checkPermission, writeTuple, deleteTuple } from '@/lib/fga';
import { requireAuth } from '@/lib/auth';
import { oktaManagementAPI } from '@/lib/okta-management';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const partnerId = params.id;
 
    console.log(`✅❓ FGA check: is user ${user.sub} related to partner ${partnerId} as can_view?`);

    // Check if user has can_view permission on the partner
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

    if (!user_can_view) {
      console.log(`❌ User ${user.sub} is not authorized to view partner ${partnerId}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    //console.log(`✅ User ${user.sub} is authorized to view partner ${partnerId}`);

    // Get partner details to check if it has an organization
    const partners = await sql`
      SELECT * FROM partners WHERE id = ${partnerId}
    `;

    if (partners.length === 0) {
      console.log(`Partner not found: ${partnerId}`);
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partner = partners[0];
    console.log(`Found partner: ${partner.name} (${partner.id})`);

    // Get team members for this partner
    const teamMembers = await sql`
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
      WHERE pu.partner_id = ${partnerId}
      ORDER BY pu.created_at DESC
    `;

    // Map database roles to frontend roles for display
    const mappedTeamMembers = teamMembers.map(member => ({
      ...member,
      role: member.role // The role is already in the correct format (can_admin, can_manage_members, can_view)
    }));

    console.log(`Found ${mappedTeamMembers.length} team members for partner ${partnerId}`);
    
    // Return team members with permission status and partner data
    return NextResponse.json({
      teamMembers: mappedTeamMembers,
      partner: {
        id: partner.id,
        name: partner.name,
        type: partner.type
      },
      userCanView: user_can_view,
      userCanManageMembers: user_can_manage_members
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
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
    const { email, firstName, lastName, role = 'can_view' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!firstName) {
      return NextResponse.json({ error: 'First name is required' }, { status: 400 });
    }

    if (!lastName) {
      return NextResponse.json({ error: 'Last name is required' }, { status: 400 });
    }

    if (!['can_admin', 'can_manage_members', 'can_view'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    console.log(`✅❓ FGA check: is user ${user.sub} related to partner ${partnerId} as can_manage_members?`);
    
    // Check if user has can_manage_members permission on the partner
    const user_can_manage_members = await checkPermission(
      `user:${user.sub}`,
      'can_manage_members',
      `partner:${partnerId}`
    );

    if (!user_can_manage_members) {
      console.log(`❌ User ${user.sub} is not authorized to manage members for partner ${partnerId}`);
      return NextResponse.json({ error: 'Forbidden - insufficient permissions. You need can_manage_members permission.' }, { status: 403 });
    }

    //console.log(`✅ User ${user.sub} is authorized to manage members for partner ${partnerId}`);

    // Get partner details
    const partners = await sql`
      SELECT * FROM partners WHERE id = ${partnerId}
    `;

    if (partners.length === 0) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const partner = partners[0];
    console.log(`Found partner: ${partner.name} (${partner.id})`);

    if (!partner.organization_id) {
      return NextResponse.json({ error: 'Partner organization not found' }, { status: 400 });
    }

    // 1. Create FGA tuple for the new user with the specified role FIRST
    console.log(`Creating FGA tuple for user with role ${role} on partner ${partnerId}`);
    
    // We'll create the FGA tuple with a temporary user ID that we'll update later
    const tempUserId = `temp_${Date.now()}`;
    
    try {
      await writeTuple(
        `user:${tempUserId}`,
        role,
        `partner:${partnerId}`
      );
      console.log(`✅ Created FGA tuple: user:${tempUserId} ${role} partner:${partnerId}`);
    } catch (fgaError) {
      console.error('Failed to create FGA tuple:', fgaError);
      return NextResponse.json({ error: 'Failed to create FGA permissions' }, { status: 500 });
    }

    // 2. Create user in Okta with proper groups and set as active
    console.log(`Creating Okta user for email: ${email} with name: ${firstName} ${lastName}`);
    let oktaUserId: string;
    
    try {
      // Create user in Okta with first name and last name
      const displayName = `${firstName} ${lastName}`;
      const oktaUser = await oktaManagementAPI.createUser(email, displayName, partner.organization_id);
      oktaUserId = oktaUser.user_id;
      console.log(`✅ Created Okta user: ${oktaUserId} for email: ${email}`);
      
      // Add user to the main partner group (00gokkv76cF6V5no21d7)
      await oktaManagementAPI.addUserToGroup(oktaUserId, '00gokkv76cF6V5no21d7');
      console.log(`✅ Added user ${oktaUserId} to main partner group: 00gokkv76cF6V5no21d7`);
      
      // Add user to the specific partner group
      await oktaManagementAPI.addUserToGroup(oktaUserId, partner.organization_id);
      console.log(`✅ Added user ${oktaUserId} to partner group: ${partner.organization_id}`);
      
      // Activate the user in Okta
      await oktaManagementAPI.activateUser(oktaUserId);
      console.log(`✅ Activated Okta user: ${oktaUserId}`);
      
    } catch (oktaError) {
      console.error('Failed to create Okta user:', oktaError);
      return NextResponse.json({ error: 'Failed to create Okta user' }, { status: 500 });
    }

    // 3. Update the FGA tuple with the real Okta user ID
    try {
      // Delete the temporary tuple
      await deleteTuple(
        `user:${tempUserId}`,
        role,
        `partner:${partnerId}`
      );
      console.log(`✅ Deleted temporary FGA tuple: user:${tempUserId} ${role} partner:${partnerId}`);
      
      // Create the real tuple with the Okta user ID
      await writeTuple(
        `user:${oktaUserId}`,
        role,
        `partner:${partnerId}`
      );
      console.log(`✅ Created FGA tuple: user:${oktaUserId} ${role} partner:${partnerId}`);
    } catch (fgaError) {
      console.error('Failed to update FGA tuple:', fgaError);
      return NextResponse.json({ error: 'Failed to create FGA permissions' }, { status: 500 });
    }

    // 4. Create user record in NeonDB
    const userId = generateId();
    await sql`
      INSERT INTO users (id, auth0_user_id, email, display_name)
      VALUES (${userId}, ${oktaUserId}, ${email}, ${firstName + ' ' + lastName})
    `;
    console.log(`✅ Created NeonDB user: ${userId}`);

    // 4. Create partner user relationship in NeonDB
    // Database now uses the same role values as FGA
    const partnerUserId = generateId();
    await sql`
      INSERT INTO partner_users (id, partner_id, user_id, role, status, invited_by, email)
      VALUES (${partnerUserId}, ${partnerId}, ${userId}, ${role}, 'pending', null, ${email})
    `;
    console.log(`✅ Created partner user relationship: ${partnerUserId} with DB role: ${role}`);

    // Return the created team member
    const newMember = await sql`
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
      WHERE pu.id = ${partnerUserId}
    `;

    console.log('✅ Successfully created team member, returning response');
    return NextResponse.json(newMember[0]);
    
  } catch (error) {
    console.error('❌ Error in POST handler:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

 