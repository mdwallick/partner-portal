import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Check if this is a redirect from Okta logout
    const isLogoutRedirect = url.searchParams.has('state') || url.searchParams.has('error');
    
    console.log('Logout API called:', {
      isLogoutRedirect,
      hasState: url.searchParams.has('state'),
      hasError: url.searchParams.has('error'),
      state: url.searchParams.get('state'),
      error: url.searchParams.get('error')
    });
    
    // Clear cookies in ALL cases
    const clearCookies = (response: NextResponse) => {
      response.cookies.set('okta_access_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        expires: new Date(0)
      });

      response.cookies.set('okta_id_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        expires: new Date(0)
      });

      response.cookies.set('okta_refresh_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
        expires: new Date(0)
      });
    };
    
    // If this is a redirect from Okta logout, redirect to login with cache-busting
    if (isLogoutRedirect) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('logout', 'true');
      loginUrl.searchParams.set('t', Date.now().toString());
      const response = NextResponse.redirect(loginUrl.toString());
      clearCookies(response);
      return response;
    }

    // Get the ID token from cookies
    const idToken = request.cookies.get('okta_id_token')?.value;
    
    console.log('Starting logout process:', {
      hasIdToken: !!idToken,
      idTokenLength: idToken?.length || 0
    });
    
    // If we have an ID token, use it to logout from Okta
    if (idToken) {
      const logoutUrl = new URL('/oauth2/v1/logout', process.env.OKTA_ISSUER);
      logoutUrl.searchParams.set('client_id', process.env.OKTA_CLIENT_ID!);
      logoutUrl.searchParams.set('id_token_hint', idToken);
      logoutUrl.searchParams.set('post_logout_redirect_uri', 'http://localhost:3000/api/auth/logout?state=logged_out');
      
      console.log('Redirecting to Okta logout:', logoutUrl.toString());
      const response = NextResponse.redirect(logoutUrl.toString());
      clearCookies(response);
      return response;
    }

    // If no ID token, just redirect to login with cache-busting
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('logout', 'true');
    loginUrl.searchParams.set('t', Date.now().toString());
    const response = NextResponse.redirect(loginUrl.toString());
    clearCookies(response);
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'logout_failed');
    const response = NextResponse.redirect(loginUrl.toString());
    
    // Clear cookies even on error
    response.cookies.set('okta_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      expires: new Date(0)
    });

    response.cookies.set('okta_id_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      expires: new Date(0)
    });

    response.cookies.set('okta_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      expires: new Date(0)
    });
    
    return response;
  }
} 