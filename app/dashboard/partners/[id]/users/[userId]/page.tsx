"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Save, User, Mail, Shield, Trash2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"

interface User {
  id: string
  email: string
  display_name?: string
  role: string
  created_at: string
  auth0_user_id?: string
}

interface Partner {
  id: string
  name: string
  type: "artist" | "merch_supplier"
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  const userId = params.userId as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [userCanManageMembers, setUserCanManageMembers] = useState(false)
  const [formData, setFormData] = useState({
    display_name: "",
    role: "",
  })

  const fetchPartnerData = useCallback(async () => {
    try {
      const response = await fetch(`/api/partners/${partnerId}`)
      if (response.ok) {
        const data = await response.json()
        setPartner(data)
      }
    } catch (error) {
      console.error("Error fetching partner:", error)
    }
  }, [partnerId])

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch(`/api/partners/${partnerId}/users/${userId}`, {
        headers: { "Content-Type": "application/json" },
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setUserCanManageMembers(data.userCanManageMembers || false)
        setFormData({
          display_name: data.display_name || "",
          role: data.role,
        })
      } else {
        toast.error("Failed to fetch user details")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      toast.error("Failed to fetch user details")
    } finally {
      setLoading(false)
    }
  }, [partnerId, userId])

  useEffect(() => {
    if (partnerId && userId) {
      fetchPartnerData()
      fetchUserData()
    }
  }, [partnerId, userId, fetchPartnerData, fetchUserData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/partners/${partnerId}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("User updated successfully!")
        fetchUserData() // Refresh user data
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone and will remove the user from Auth0, FGA, and the database."
      )
    ) {
      return
    }

    setDeleting(true)

    try {
      const response = await fetch(`/api/partners/${partnerId}/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        toast.success("User deleted successfully!")
        router.push(`/dashboard/partners/${partnerId}/users`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user")
    } finally {
      setDeleting(false)
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "can_admin":
      case "partner_admin":
        return "Full administrative access to the partner organization"
      case "can_manage_members":
      case "partner_manager":
        return "Can add, remove, and manage team members"
      case "can_view":
      case "partner_viewer":
        return "Can view partner information and data"
      default:
        return ""
    }
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
          <Link
            href={`/dashboard/partners/${partnerId}/users`}
            className="inline-flex items-center text-orange-400 hover:text-orange-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team Members
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/dashboard/partners/${partnerId}/users`}
                className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Team Members
              </Link>

              {userCanManageMembers && (
                <button
                  onClick={handleDeleteUser}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </>
                  )}
                </button>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">User Details</h1>
            <p className="text-lg text-gray-400">Manage user details for {partner?.name}</p>
          </div>

          {/* User Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Details Card */}
            <div className="bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-white">User Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-white">{user.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Auth0 User ID
                  </label>
                  <span className="text-sm text-white font-mono">
                    {user.auth0_user_id || "Not available"}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Joined</label>
                  <span className="text-sm text-white">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Role Card */}
            <div className="bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-white">Current Role</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                    {user.role === "can_admin" || user.role === "partner_admin"
                      ? "Can Admin"
                      : user.role === "can_manage_members" || user.role === "partner_manager"
                        ? "Can Manage Members"
                        : user.role === "can_view" || user.role === "partner_viewer"
                          ? "Can View"
                          : user.role}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <p className="text-sm text-gray-400">{getRoleDescription(user.role)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-6">
              {userCanManageMembers ? "Edit User Details" : "User Details (Read Only)"}
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="display_name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="display_name"
                    value={formData.display_name}
                    onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                    disabled={!userCanManageMembers}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter display name"
                  />
                  <p className="mt-1 text-sm text-gray-400">
                    This name will be updated in Auth0 and the database
                  </p>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    disabled={!userCanManageMembers}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="can_view">Can View</option>
                    <option value="can_manage_members">Can Manage Members</option>
                    <option value="can_admin">Can Admin</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-400">
                    This role will be updated in FGA and the database
                  </p>
                </div>
              </div>

              {userCanManageMembers && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
