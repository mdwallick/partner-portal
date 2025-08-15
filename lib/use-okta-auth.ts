'use client';

import { useState, useEffect, useCallback } from 'react';
import { OktaUser } from './okta';

interface UseOktaAuthReturn {
  user: OktaUser | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

export function useOktaAuth(): UseOktaAuthReturn {
  const [user, setUser] = useState<OktaUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get access token from cookies
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const data = await response.json();
        return data.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }, []);

  // Get user info from Okta
  const getUserInfo = useCallback(async (accessToken: string): Promise<OktaUser | null> => {
    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error getting user info:', error);
      return null;
    }
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setUser(null);
        return;
      }

      const userInfo = await getUserInfo(accessToken);
      setUser(userInfo);
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Failed to check authentication status');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, getUserInfo]);

  // Login function
  const login = useCallback(() => {
    window.location.href = '/api/auth/login';
  }, []);

  // Logout function
  const logout = useCallback(() => {
    window.location.href = '/api/auth/logout';
  }, []);

  // Check auth on mount and when dependencies change
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    getAccessToken
  };
} 