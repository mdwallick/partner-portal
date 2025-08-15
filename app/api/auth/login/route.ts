import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the current URL to use as state
    const url = new URL(request.url);
    const state = url.searchParams.get('state') || 'default';
    
    // Build the Okta authorization URL manually
    const authUrl = new URL('/oauth2/v1/authorize', process.env.OKTA_ISSUER);
    authUrl.searchParams.set('client_id', process.env.OKTA_CLIENT_ID!);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('redirect_uri', process.env.OKTA_REDIRECT_URI || 'http://localhost:3000/login/callback');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'query');

    // Redirect to Okta's authorization endpoint
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error creating login URL:', error);
    return NextResponse.json({ 
      error: 'Failed to create login URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 