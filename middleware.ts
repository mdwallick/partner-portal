import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user is authenticated by looking for the okta access token cookie
  const hasAccessToken = request.cookies.has('okta_access_token');
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!hasAccessToken) {
      console.log('Middleware: No access token found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Protect API routes (except auth endpoints)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!hasAccessToken) {
      console.log('Middleware: No access token found for API route');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/partners/:path*',
    '/api/games/:path*', 
    '/api/sku/:path*',
    '/api/admin/:path*',
    '/api/debug-session',
    '/api/log-navigation'
  ]
}; 