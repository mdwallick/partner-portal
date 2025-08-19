"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Users, FileMusic, ShoppingBag, Eye, Trash } from "lucide-react"
import Image from "next/image"
import { Partner, Song, SKU, User } from "@/lib/types"

export default function PartnerDetailPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [skus, setSkus] = useState<SKU[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && user && partnerId) {
      const fetchUsersData = async () => {
        try {
          const usersResponse = await fetch(`/api/partners/${partnerId}/users`)
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            setUsers(usersData.teamMembers || usersData) // Handle both new and old format
          }
        } catch (error) {
          console.error("Error fetching users:", error)
        }
      }

      const fetchSKUsData = async () => {
        try {
          const skusResponse = await fetch(`/api/partners/${partnerId}/skus`)
          if (skusResponse.ok) {
            const skusData = await skusResponse.json()
            setSkus(skusData)
          }
        } catch (error) {
          console.error("Error fetching SKUs:", error)
        }
      }

      const fetchPartnerData = async () => {
        try {
          setLoading(true)

          // Fetch partner details with Authorization header
          const partnerResponse = await fetch(`/api/partners/${partnerId}`)
          if (partnerResponse.ok) {
            const partnerData = await partnerResponse.json()
            setPartner(partnerData)

            // Fetch related data based on partner type
            if (partnerData.type === "artist") {
              await fetchSongsData()
            } else if (partnerData.type === "merch_supplier") {
              await fetchSKUsData()
            }

            // Always fetch team members
            await fetchUsersData()
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

      const fetchSongsData = async () => {
        try {
          const songsResponse = await fetch(`/api/partners/${partnerId}/songs`)
          if (songsResponse.ok) {
            const songsData = await songsResponse.json()
            setSongs(songsData)
          }
        } catch (error) {
          console.error("Error fetching games:", error)
        }
      }

      fetchPartnerData()
    }
  }, [user, isLoading, partnerId])

  const handleDeletePartner = async () => {
    if (
      !confirm(`Are you sure you want to delete ${partner?.name}? This action cannot be undone.`)
    ) {
      return
    }

    try {
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: "DELETE",
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
    return type === "artist" ? "Artist" : "Merchandise Supplier"
  }

  const getPartnerTypeIcon = (type: string) => {
    return type === "artist" ? "🎤" : "🛍️"
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
                  <Image
                    src={partner.logo_url}
                    alt={`${partner.name} logo`}
                    width={80}
                    height={80}
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
                    {partner.type === "artist" ? "🎸" : "🛍️"}
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">
                  {partner.type === "artist" ? "Songs" : "Products"}
                </p>
                <p className="text-2xl font-bold text-white">
                  {partner.type === "artist" ? songs.length : skus.length}
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
                  {/* TODO: Add songs count */}
                  {partner.type === "artist"
                    ? songs.filter(g => g.id.length > 0).length
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
        {partner.type === "artist" ? (
          <div className="space-y-8">
            {/* Songs Section */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Songs</h2>
                {partner.userCanAdmin && (
                  <Link
                    href={`/dashboard/partners/${partnerId}/songs/new`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <FileMusic className="h-4 w-4 mr-2" />
                    Add Song
                  </Link>
                )}
              </div>

              {songs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {songs.map(song => (
                    <div
                      key={song.id}
                      className="border border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-orange-500 bg-gray-700"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {song.picture_url ? (
                            <Image
                              src={song.picture_url}
                              alt={song.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-600 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-lg">🎵</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/dashboard/partners/${partnerId}/songs/${song.id}`}
                            className="block"
                          >
                            <h3 className="font-medium text-white truncate">{song.name}</h3>
                          </Link>
                          <p className="text-sm text-gray-400">
                            {song.genre || "Unknown genre"}
                            {typeof (song as any).duration_s === "number" && (
                              <>
                                {" • "}
                                {Math.floor(((song as any).duration_s || 0) / 60)}:
                                {String(((song as any).duration_s || 0) % 60).padStart(2, "0")}
                              </>
                            )}
                          </p>
                        </div>
                        {partner.userCanAdmin && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete song "${song.name}"?`)) return
                              try {
                                const resp = await fetch(
                                  `/api/partners/${partnerId}/songs/${song.id}`,
                                  {
                                    method: "DELETE",
                                  }
                                )
                                if (resp.ok) {
                                  setSongs(prev => prev.filter(s => s.id !== song.id))
                                }
                              } catch (e) {
                                console.error("Failed to delete song", e)
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-500"
                            title="Delete song"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileMusic className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">No songs created yet.</p>
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
                            <Image
                              src={sku.image_url}
                              alt={sku.name}
                              width={48}
                              height={48}
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
