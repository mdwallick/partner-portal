"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useCallback, useEffect, useState } from "react"
import { Users, Trash2, Mail, ArrowLeft, Eye } from "lucide-react"
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

export default function PartnerUsersPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteFirstName, setInviteFirstName] = useState("")
  const [inviteLastName, setInviteLastName] = useState("")
  const [inviteRole, setInviteRole] = useState("can_view")
  const [inviting, setInviting] = useState(false)
  const [_userCanView, setUserCanView] = useState(false)
  const [_userCanAdmin, setUserCanAdmin] = useState(false)
  const [userCanManageMembers, setUserCanManageMembers] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/partners/${partnerId}/users`)

      if (response.ok) {
        const data = await response.json()
        console.log("Users API response:", data)
        setUsers(data.teamMembers || data) // Handle both new and old format
        setPartner(data.partner || null) // Set partner data from the same API call
        setUserCanView(data.userCanView || false)
        setUserCanAdmin(data.userCanAdmin || false)
        setUserCanManageMembers(data.userCanManageMembers || false)
        console.log("Set userCanManageMembers to:", data.userCanManageMembers || false)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }, [partnerId])

  useEffect(() => {
    if (!isLoading && user && partnerId) {
      fetchUsers()
    }
  }, [user, isLoading, partnerId, fetchUsers])

  // Debug effect to log permission changes
  useEffect(() => {
    console.log("userCanManageMembers changed to:", userCanManageMembers)
  }, [userCanManageMembers])

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)

    try {
      const response = await fetch(`/api/partners/${partnerId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          firstName: inviteFirstName,
          lastName: inviteLastName,
          role: inviteRole,
        }),
      })

      if (response.ok) {
        toast.success("User invited successfully!")
        setInviteEmail("")
        setInviteFirstName("")
        setInviteLastName("")
        setInviteRole("can_view")
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to invite user")
      }
    } catch (error) {
      console.error("Error inviting user:", error)
      toast.error("Failed to invite user")
    } finally {
      setInviting(false)
    }
  }

  const handleViewUserProfile = (user: User) => {
    router.push(`/dashboard/partners/${partnerId}/users/${user.id}`)
  }

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this user?")) {
      return
    }

    try {
      const response = await fetch(`/api/partners/${partnerId}/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("User removed successfully!")
        setUsers(users.filter(user => user.id !== userId))
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to remove user")
      }
    } catch (error) {
      console.error("Error removing user:", error)
      toast.error("Failed to remove user")
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "can_admin":
      case "partner_admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-300">
            Can Admin
          </span>
        )
      case "can_manage_members":
      case "partner_manager":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
            Can Manage Members
          </span>
        )
      case "can_view":
      case "partner_viewer":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
            Can View
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
            {role}
          </span>
        )
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "can_admin":
        return "Full administrative access to the partner organization"
      case "can_manage_members":
        return "Can add, remove, and manage team members"
      case "can_view":
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

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Link
                href={`/dashboard/partners/${partnerId}`}
                className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Partner
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Team Members - {partner?.name}</h1>
            {userCanManageMembers && (
              <p className="text-lg text-gray-400">Manage users in this partner organization</p>
            )}
          </div>

          {/* Invite User Form */}
          {userCanManageMembers && (
            <div className="bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-6">Invite New User</h3>
              <form onSubmit={handleInviteUser} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-3">
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={inviteFirstName}
                      onChange={e => setInviteFirstName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400"
                      placeholder="John"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={inviteLastName}
                      onChange={e => setInviteLastName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400"
                      placeholder="Doe"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                      Role *
                    </label>
                    <select
                      id="role"
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white"
                    >
                      <option value="can_view">Can View</option>
                      <option value="can_manage_members">Can Manage Members</option>
                      <option value="can_admin">Can Admin</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-400">{getRoleDescription(inviteRole)}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={inviting || !inviteEmail || !inviteFirstName || !inviteLastName}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {inviting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Inviting...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="bg-gray-800 shadow rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Current Team Members</h3>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <p>No team members yet</p>
                <p className="text-sm text-gray-500 mt-1">Invite users to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {user.display_name || user.email}
                            </div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewUserProfile(user)}
                              className="text-orange-400 hover:text-orange-300 flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </button>
                            {userCanManageMembers && (
                              <button
                                onClick={() => handleRemoveUser(user.id)}
                                className="text-red-400 hover:text-red-300 flex items-center space-x-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
