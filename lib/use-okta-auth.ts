"use client"

import { useUser } from "@auth0/nextjs-auth0"

export function useOktaAuth() {
  // Temporary alias to avoid mass renames: use Auth0 hook under existing name
  const { user, error, isLoading } = useUser()

  const login = () => {
    window.location.href = "/api/auth/login"
  }
  const logout = () => {
    window.location.href = "/api/auth/logout"
  }
  const getAccessToken = async () => null // Not needed for basic session; API routes use server-side session

  return { user, error: error?.message ?? null, isLoading, login, logout, getAccessToken }
}
