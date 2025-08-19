"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Filter, Users, Shield, Eye } from "lucide-react"
import Image from "next/image"

interface Partner {
  id: string
  name: string
  type: "artist" | "merch_supplier"
  logo_url?: string
  organization_id?: string
  created_at: string
  assigned_cr_admin?: string
}

interface UserRole {
  is_cr_super_admin: boolean
  is_cr_admin: boolean
}

export default function PartnersPage() {
  const { user, isLoading } = useUser()
  const [partners, setPartners] = useState<Partner[]>([])
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "artist" | "merch_supplier">("all")

  // Log when page renders
  useEffect(() => {
    console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n")
    console.log("📄 Partners Page Rendered")
  }, [])

  useEffect(() => {
    if (user?.sub) {
      fetchUserRole()
      fetchPartners()
    }
  }, [user?.sub])

  const fetchUserRole = async () => {
    try {
      const response = await fetch("/api/admin/test-permissions")
      if (response.ok) {
        const data = await response.json()
        setUserRole({
          is_cr_super_admin: data.permissions.super_admin,
          is_cr_admin: data.permissions.super_admin, // For now, treat super admin as cr_admin too
        })
      }
    } catch (error) {
      console.error("Error fetching user role:", error)
    }
  }

  const fetchPartners = async () => {
    try {
      setLoading(true)

      // Call the partners API with the Authorization header
      const response = await fetch("/api/partners")

      if (response.ok) {
        const data = await response.json()
        setPartners(data)
      } else {
        console.error("Failed to fetch partners:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error fetching partners:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || partner.type === filterType
    return matchesSearch && matchesFilter
  })

  const getPartnerTypeLabel = (type: string) => {
    return type === "artist" ? "Artist" : "Merchandise Supplier"
  }

  const getPartnerTypeIcon = (type: string) => {
    return type === "artist" ? "🎸" : "🛍️"
  }

  const getPartnerTypeColor = (type: string) => {
    return type === "artist" ? "bg-blue-900 text-blue-300" : "bg-green-900 text-green-300"
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

  // All users can access the partners page, but they will only see partners they have access to via FGA

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Partner Management</h1>
              <p className="text-gray-400 mt-2">
                View and manage partner organizations you have access to
              </p>
              {userRole?.is_cr_super_admin && (
                <div className="flex items-center mt-2 text-sm text-orange-500">
                  <Shield className="h-4 w-4 mr-1" />
                  SME Super Admin Access
                </div>
              )}
            </div>
            {(userRole?.is_cr_super_admin || userRole?.is_cr_admin) && (
              <Link
                href="/dashboard/partners/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Partner
              </Link>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="game_studio">Game Studios</option>
                <option value="merch_supplier">Merch Suppliers</option>
              </select>
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredPartners.map(partner => (
                  <tr key={partner.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {partner.logo_url ? (
                            <Image
                              src={partner.logo_url}
                              alt={`${partner.name} logo`}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-cover"
                              onError={e => {
                                // Hide the broken image and show fallback
                                e.currentTarget.style.display = "none"
                                e.currentTarget.nextElementSibling?.classList.remove("hidden")
                              }}
                            />
                          ) : null}
                          <div
                            className={`h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold ${partner.logo_url ? "hidden" : ""}`}
                          >
                            {partner.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">{partner.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getPartnerTypeIcon(partner.type)}</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPartnerTypeColor(partner.type)}`}
                        >
                          {getPartnerTypeLabel(partner.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(partner.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {partner.assigned_cr_admin ? (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {partner.assigned_cr_admin}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/dashboard/partners/${partner.id}`}
                          className="text-orange-500 hover:text-orange-400 p-1 rounded-md hover:bg-gray-700"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {userRole?.is_cr_super_admin && (
                          <Link
                            href={`/dashboard/partners/${partner.id}/admins`}
                            className="text-purple-400 hover:text-purple-300 p-1 rounded-md hover:bg-gray-700"
                            title="Manage Admins"
                          >
                            <Shield className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredPartners.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No partners found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first partner."}
              </p>
              {!searchTerm && filterType === "all" && (
                <Link
                  href="/dashboard/partners/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Partner
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Partner Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{partners.length}</p>
              <p className="text-sm text-gray-400">Total Partners</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {partners.filter(p => p.type === "artist").length}
              </p>
              <p className="text-sm text-gray-400">Artists</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {partners.filter(p => p.type === "merch_supplier").length}
              </p>
              <p className="text-sm text-gray-400">Merch Suppliers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {partners.filter(p => p.assigned_cr_admin).length}
              </p>
              <p className="text-sm text-gray-400">Assigned to SME Admin</p>
            </div>
          </div>
        </div>

        {/* CR Super Admin Actions */}
        {userRole?.is_cr_super_admin && (
          <div className="mt-8 bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">SME Super Admin Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/dashboard/super-admin/manage-admins"
                className="flex items-center p-4 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Shield className="h-8 w-8 text-purple-400 mr-3" />
                <div>
                  <p className="font-medium text-white">Manage SME Admins</p>
                  <p className="text-sm text-gray-400">Add or remove SME admin roles</p>
                </div>
              </Link>
              <Link
                href="/dashboard/super-admin/assignments"
                className="flex items-center p-4 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Users className="h-8 w-8 text-blue-400 mr-3" />
                <div>
                  <p className="font-medium text-white">Partner Assignments</p>
                  <p className="text-sm text-gray-400">Assign partners to SME admins</p>
                </div>
              </Link>
              <Link
                href="/dashboard/super-admin/stats"
                className="flex items-center p-4 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg
                  className="h-8 w-8 text-green-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-white">System Stats</p>
                  <p className="text-sm text-gray-400">View system-wide statistics</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
