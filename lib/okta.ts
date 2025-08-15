export interface OktaUser {
  sub: string;
  email: string;
  name?: string;
  nickname?: string;
  picture?: string;
  email_verified: boolean;
  updated_at?: string;
}

// Initialize Okta Auth client only on client side
let oktaAuth: any = null;

if (typeof window !== 'undefined') {
  // Only import on client side
  const { OktaAuth } = require('@okta/okta-auth-js');
  oktaAuth = new OktaAuth({
    issuer: process.env.OKTA_ISSUER!,
    clientId: process.env.OKTA_CLIENT_ID!,
    redirectUri: process.env.OKTA_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    scopes: ['openid', 'profile', 'email'],
    pkce: true
  });
}

export { oktaAuth };

// Helper function to get user info from Okta
export async function getUserInfo(accessToken: string): Promise<OktaUser> {
  try {
    const response = await fetch(`${process.env.OKTA_ISSUER}/oauth2/v1/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    const userInfo = await response.json();
    
    return {
      sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      nickname: userInfo.nickname,
      picture: userInfo.picture,
      email_verified: userInfo.email_verified || false,
      updated_at: userInfo.updated_at
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
}

// Helper function to validate access token
export async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.OKTA_ISSUER}/oauth2/v1/introspect`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.OKTA_CLIENT_ID}:${process.env.OKTA_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `token=${accessToken}&token_type_hint=access_token`
    });

    if (!response.ok) {
      console.error('Token introspection failed:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    //console.log('Token introspection result:', result);
    return result.active === true;
  } catch (error) {
    console.error('Error validating access token:', error);
    return false;
  }
} 