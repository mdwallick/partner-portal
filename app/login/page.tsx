"use client"

import { Suspense, useEffect } from "react"
import { useUser } from "@auth0/nextjs-auth0"
import { useRouter, useSearchParams } from "next/navigation"
import { Gamepad2, ShoppingBag, Users } from "lucide-react"

function LoginContent() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const isLogout = searchParams.get("logout") === "true"

    // If user is logged in and this is not a logout redirect, go to dashboard
    if (user && !isLogout) {
      router.push("/dashboard")
    }
  }, [user, router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const _isLogout = searchParams.get("logout") === "true"
  const hasError = searchParams.get("error")

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-8 text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Artist Portal</h1>
            <p className="text-gray-400">Manage your songs and products with ease</p>
          </div>

          {hasError && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">❌ Logout failed. Please try again.</p>
            </div>
          )}

          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-400">
                <Gamepad2 className="w-5 h-5" />
                <span className="text-sm">Artists</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-sm">Merch Suppliers</span>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center justify-center space-x-2 text-orange-400">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Secure Partner Access</span>
              </div>
            </div>
          </div>

          <a href="/auth/login">
            <button className="w-full text-lg py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
              Sign In with Auth0
            </button>
          </a>

          <p className="text-xs text-gray-500 mt-4">Secure authentication powered by Auth0</p>
          <p className="text-xs text-gray-500 mt-1">Secure authorization powered by Okta FGA</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
