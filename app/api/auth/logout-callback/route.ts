import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This endpoint is specifically for handling Okta logout redirects
    // Just redirect to login page
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Error in logout callback:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 