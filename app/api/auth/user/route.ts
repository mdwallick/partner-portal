import { NextRequest, NextResponse } from 'next/server';
import { getUserInfo } from '@/lib/okta';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);
    
    // Get user info from Okta
    const userInfo = await getUserInfo(accessToken);
    
    return NextResponse.json(userInfo);
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json({ 
      error: 'Failed to get user info',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 