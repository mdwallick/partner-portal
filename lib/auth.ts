import { NextRequest, NextResponse } from 'next/server';
import { getUserInfo, validateAccessToken, OktaUser } from '@/lib/okta';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  name?: string;
  nickname?: string;
  picture?: string;
  email_verified: boolean;
}

export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('👤 No valid authorization header found');
      return null;
    }

    const accessToken = authHeader.substring(7);
    
    // Validate the access token
    const isValid = await validateAccessToken(accessToken);
    if (!isValid) {
      console.log('👤 Invalid access token');
      return null;
    }

    // Get user info from Okta
    const userInfo = await getUserInfo(accessToken);
    return userInfo as AuthenticatedUser;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthenticatedUser> {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
      console.log('🚫 Authentication required - no valid session found');
      throw new Error('Authentication required - please log in');
    }
    
    console.log(`👤 Authenticated user: ${user.email} (${user.sub})`);
    return user;
  } catch (error) {
    console.log('🚫 Authentication required - no valid session found');
    throw new Error('Authentication required - please log in');
  }
} 