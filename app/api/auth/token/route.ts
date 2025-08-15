import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the access token from cookies
    const accessToken = request.cookies.get('okta_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error getting access token:', error);
    return NextResponse.json({ 
      error: 'Failed to get access token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 