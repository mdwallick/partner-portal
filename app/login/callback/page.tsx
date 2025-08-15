"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        setIsChecking(true)

        // Check if we have a valid access token
        const tokenResponse = await fetch("/api/auth/token")

        if (tokenResponse.ok) {
          // Token exists, check if user info is available
          const userResponse = await fetch("/api/auth/user", {
            headers: {
              Authorization: `Bearer ${(await tokenResponse.json()).accessToken}`,
            },
          })

          if (userResponse.ok) {
            // User is authenticated, redirect to dashboard
            router.push("/dashboard")
            return
          } else {
            console.error("Failed to get user info:", userResponse.status)
            setError("Failed to get user information")
          }
        } else {
          console.error("No valid token found:", tokenResponse.status)
          setError("Authentication failed - no valid token")
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
        setError("Failed to complete authentication")
      } finally {
        setIsChecking(false)
      }
    }

    // Add a small delay to ensure cookies are set
    const timer = setTimeout(checkAuthentication, 500)
    return () => clearTimeout(timer)
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card text-center">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Authentication Error</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <button onClick={() => router.push("/login")} className="btn-primary">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card text-center">
          <div className="mb-8">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Completing Sign In</h1>
            <p className="text-gray-600">Please wait while we complete your authentication...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
