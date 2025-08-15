import { NextRequest, NextResponse } from 'next/server';
import { getUserInfo } from '@/lib/okta';

export async function GET(request: NextRequest) {
  try {
    // Get the access token from cookies
    const accessToken = request.cookies.get('okta_access_token')?.value;
    const idToken = request.cookies.get('okta_id_token')?.value;
    const refreshToken = request.cookies.get('okta_refresh_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'No access token found',
        message: 'You need to be logged in to see session data'
      }, { status: 401 });
    }

    // Get user info from Okta
    const userInfo = await getUserInfo(accessToken);

    // Return the session data
    return NextResponse.json({
      success: true,
      session: {
        user: userInfo,
        accessToken: accessToken,
        idToken: idToken,
        refreshToken: refreshToken,
      },
      tokens: {
        accessToken: accessToken,
        idToken: idToken,
        refreshToken: refreshToken,
      }
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ 
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 