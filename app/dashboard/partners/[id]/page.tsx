"use client"

import { useOktaAuth } from "@/lib/use-okta-auth"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Users, Gamepad2, ShoppingBag, Eye } from "lucide-react"

interface Partner {
  id: string
  name: string
  type: "game_studio" | "merch_supplier"
  logo_url?: string
  organization_id?: string
  created_at: string
  userCanView?: boolean
  userCanAdmin?: boolean
  userCanManageMembers?: boolean
}

interface Game {
  id: string
  name: string
  type?: string
  picture_url?: string
  created_at: string
  client_ids_count: number
}

interface SKU {
  id: string
  name: string
  category?: string
  image_url?: string
  status: "active" | "inactive"
  created_at: string
}

interface User {
  id: string
  email: string
  display_name?: string
  role: string
  created_at: string
  auth0_user_id?: string
}

export default function PartnerDetailPage() {
  const { user, isLoading } = useOktaAuth()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [skus, setSkus] = useState<SKU[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && user && partnerId) {
      fetchPartnerData()
    }
  }, [user, isLoading, partnerId])

  const fetchPartnerData = async () => {
    try {
      setLoading(true)

      // Get the access token from the API
      const tokenResponse = await fetch("/api/auth/token")
      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token")
      }

      const { accessToken } = await tokenResponse.json()

      // Fetch partner details with Authorization header
      const partnerResponse = await fetch(`/api/partners/${partnerId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (partnerResponse.ok) {
        const partnerData = await partnerResponse.json()
        setPartner(partnerData)

        // Fetch related data based on partner type
        if (partnerData.type === "game_studio") {
          await fetchGamesData(accessToken)
        } else if (partnerData.type === "merch_supplier") {
          await fetchSKUsData(accessToken)
        }

        // Always fetch team members
        await fetchUsersData(accessToken)
      } else {
        setError("Partner not found")
      }
    } catch (error) {
      console.error("Error fetching partner data:", error)
      setError("Failed to load partner data")
    } finally {
      setLoading(false)
    }
  }

  const fetchGamesData = async (accessToken?: string) => {
    try {
      // Get access token if not provided
      let token = accessToken
      if (!token) {
        const tokenResponse = await fetch("/api/auth/token")
        if (!tokenResponse.ok) {
          throw new Error("Failed to get access token")
        }
        const { accessToken: tokenData } = await tokenResponse.json()
        token = tokenData
      }

      const gamesResponse = await fetch(`/api/partners/${partnerId}/games`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json()
        setGames(gamesData)
      }
    } catch (error) {
      console.error("Error fetching games:", error)
    }
  }

  const fetchSKUsData = async (accessToken?: string) => {
    try {
      // Get access token if not provided
      let token = accessToken
      if (!token) {
        const tokenResponse = await fetch("/api/auth/token")
        if (!tokenResponse.ok) {
          throw new Error("Failed to get access token")
        }
        const { accessToken: tokenData } = await tokenResponse.json()
        token = tokenData
      }

      const skusResponse = await fetch(`/api/partners/${partnerId}/skus`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (skusResponse.ok) {
        const skusData = await skusResponse.json()
        setSkus(skusData)
      }
    } catch (error) {
      console.error("Error fetching SKUs:", error)
    }
  }

  const fetchUsersData = async (accessToken?: string) => {
    try {
      // Get access token if not provided
      let token = accessToken
      if (!token) {
        const tokenResponse = await fetch("/api/auth/token")
        if (!tokenResponse.ok) {
          throw new Error("Failed to get access token")
        }
        const { accessToken: tokenData } = await tokenResponse.json()
        token = tokenData
      }

      const usersResponse = await fetch(`/api/partners/${partnerId}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.teamMembers || usersData) // Handle both new and old format
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleDeletePartner = async () => {
    if (
      !confirm(`Are you sure you want to delete ${partner?.name}? This action cannot be undone.`)
    ) {
      return
    }

    try {
      // Get the access token
      const tokenResponse = await fetch("/api/auth/token")
      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token")
      }

      const { accessToken } = await tokenResponse.json()

      const response = await fetch(`/api/partners/${partnerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        router.push("/dashboard/partners")
      } else {
        setError("Failed to delete partner")
      }
    } catch (error) {
      console.error("Error deleting partner:", error)
      setError("Failed to delete partner")
    }
  }

  const getPartnerTypeLabel = (type: string) => {
    return type === "game_studio" ? "Game Studio" : "Merchandise Supplier"
  }

  const getPartnerTypeIcon = (type: string) => {
    return type === "game_studio" ? "🎮" : "🛍️"
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

  if (isLoading || loading) {
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

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Partner Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || "The requested partner could not be found."}
          </p>
          <Link href="/dashboard/partners" className="btn-primary">
            Back to Partners
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/partners"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {partner.logo_url ? (
                  <img
                    src={partner.logo_url}
                    alt={`${partner.name} logo`}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gradient-to-br from-orange-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold">
                    {partner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{partner.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">{getPartnerTypeIcon(partner.type)}</span>
                  <span className="text-lg text-gray-400">{getPartnerTypeLabel(partner.type)}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Created {new Date(partner.created_at).toLocaleDateString()}
                </p>
                {partner.organization_id && (
                  <p className="text-sm text-gray-400 mt-1">
                    Group ID:{" "}
                    <span className="font-mono text-gray-300">{partner.organization_id}</span>
                  </p>
                )}
              </div>
            </div>

            {partner.userCanAdmin && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/dashboard/partners/${partnerId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Partner
                </Link>
                <button
                  onClick={handleDeletePartner}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Partner
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-400 text-lg">
                    {partner.type === "game_studio" ? "🎮" : "🛍️"}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  {partner.type === "game_studio" ? "Games" : "Products"}
                </p>
                <p className="text-2xl font-bold text-white">
                  {partner.type === "game_studio" ? games.length : skus.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-green-400 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active</p>
                <p className="text-2xl font-bold text-white">
                  {partner.type === "game_studio"
                    ? games.filter(g => g.client_ids_count > 0).length
                    : skus.filter(s => s.status === "active").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-purple-400 text-lg">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Team Members</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on partner type */}
        {partner.type === "game_studio" ? (
          <div className="space-y-8">
            {/* Games Section */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Games</h2>
                {partner.userCanAdmin && (
                  <Link
                    href={`/dashboard/partners/${partnerId}/games/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Add Game
                  </Link>
                )}
              </div>

              {games.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {games.map(game => (
                    <Link
                      key={game.id}
                      href={`/dashboard/partners/${partnerId}/games/${game.id}`}
                      className="border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-orange-500 cursor-pointer bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {game.picture_url ? (
                            <img
                              src={game.picture_url}
                              alt={game.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-600 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-lg">🎮</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{game.name}</h3>
                          <p className="text-sm text-gray-400">
                            {game.client_ids_count} client IDs
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gamepad2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">No games created yet.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SKUs Section */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Products</h2>
                {partner.userCanAdmin && (
                  <Link
                    href={`/dashboard/partners/${partnerId}/skus/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Add Product
                  </Link>
                )}
              </div>

              {skus.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skus.map(sku => (
                    <Link
                      key={sku.id}
                      href={`/dashboard/partners/${partnerId}/skus/${sku.id}`}
                      className="border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-green-500 cursor-pointer bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {sku.image_url ? (
                            <img
                              src={sku.image_url}
                              alt={sku.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-600 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-lg">🛍️</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{sku.name}</h3>
                          <p className="text-sm text-gray-400">
                            {sku.category || "No category"} • {sku.status}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">No products created yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Members Section */}
        {partner.userCanView && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Team Members</h2>
              {partner.userCanManageMembers && (
                <Link
                  href={`/dashboard/partners/${partnerId}/users`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Link>
              )}
              {!partner.userCanManageMembers && partner.userCanView && (
                <Link
                  href={`/dashboard/partners/${partnerId}/users`}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Team
                </Link>
              )}
            </div>

            {users.length > 0 ? (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-400">No team members yet.</p>
                {partner.userCanManageMembers && (
                  <Link
                    href={`/dashboard/partners/${partnerId}/users`}
                    className="inline-flex items-center px-4 py-2 mt-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Invite First Member
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
