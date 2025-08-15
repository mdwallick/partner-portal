import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/database';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // For now, we'll return a mock partner since we don't have the full partner-user relationship set up yet
    // In a real implementation, you would:
    // 1. Look up the user's partner assignment in FGA
    // 2. Query the database for the partner details
    // 3. Return the partner information

    // Mock partner data for demonstration
    const mockPartner = {
      id: 'partner_001',
      name: 'Demo Game Studio',
      type: 'game_studio' as const,
      logo_url: null,
      created_at: new Date().toISOString()
    };

    return NextResponse.json(mockPartner);
  } catch (error) {
    console.error('Error fetching partner info:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 