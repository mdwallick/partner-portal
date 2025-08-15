import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Okta authorization error:', error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    // Exchange the authorization code for tokens using server-side fetch
    const tokenResponse = await fetch(`${process.env.OKTA_ISSUER}/oauth2/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.OKTA_CLIENT_ID}:${process.env.OKTA_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.OKTA_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
      }).toString()
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();

    // Create a response with the tokens
    const response = NextResponse.redirect(new URL('/login/callback', request.url));
    
    // Set secure HTTP-only cookies with the tokens
    if (tokens.access_token) {
      response.cookies.set('okta_access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
    }

    if (tokens.id_token) {
      response.cookies.set('okta_id_token', tokens.id_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set('okta_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 3600 // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Error handling Okta callback:', error);
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url));
  }
} 