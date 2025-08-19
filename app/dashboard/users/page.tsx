"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UsersPage() {
  const { user, isLoading } = useUser()
  // const [users, setUsers] = useState([])
  // const [loading, setLoading] = useState(true)
  const [_loading, setLoading] = useState(true)
  // const [searchTerm, setSearchTerm] = useState("")
  // const [filterRole, setFilterRole] = useState("all")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        // Replace with your actual API call to fetch users
        // For example: const response = await fetch('/api/users');
        // setUsers(await response.json());
        // For now, simulate loading
        await new Promise(resolve => setTimeout(resolve, 1000))
        setLoading(false)
      } catch (error) {
        console.error("Error fetching users:", error)
        setLoading(false)
      }
    }

    fetchUsers()
    const interval = setInterval(fetchUsers, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">Please sign in to access the partner portal.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-900">
            {/* Replace with your actual user icon */}
            <Shield className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>

        <p className="text-gray-400 mb-8">
          You don&apos;t have permission to access the global users management page. User management
          is handled at the partner level.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>

          <Link
            href="/dashboard/partners"
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            View Partners
          </Link>
        </div>
      </div>
    </div>
  )
}
