"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import Image from "next/image"

interface Partner {
  id: string
  name: string
  type: "artist" | "merch_supplier"
  logo_url?: string
  created_at: string
}

export default function EditPartnerPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && user && partnerId) {
      const fetchPartnerData = async () => {
        try {
          setLoading(true)

          const response = await fetch(`/api/partners/${partnerId}`)
          if (response.ok) {
            const partnerData = await response.json()
            setPartner(partnerData)
            setFormData({
              name: partnerData.name,
              logo_url: partnerData.logo_url || "",
            })
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

      fetchPartnerData()
    }
  }, [user, isLoading, partnerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      // Get the access token
      const tokenResponse = await fetch("/api/auth/token")
      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token")
      }

      const { accessToken } = await tokenResponse.json()

      const response = await fetch(`/api/partners/${partnerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push(`/dashboard/partners/${partnerId}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update partner")
      }
    } catch (error) {
      console.error("Error updating partner:", error)
      setError("An error occurred while updating the partner")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
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
          <Link
            href="/dashboard/partners"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Back to Partners
          </Link>
        </div>
      </div>
    )
  }

  const getPartnerTypeLabel = (type: string) => {
    return type === "artist" ? "Artist" : "Merchandise Supplier"
  }

  const getPartnerTypeIcon = (type: string) => {
    return type === "artist" ? "🎤" : "🛍️"
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partner
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit Partner</h1>
          <p className="text-gray-400 mt-2">Update partner information</p>
        </div>

        {/* Partner Info */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {partner.logo_url ? (
                <Image
                  src={partner.logo_url}
                  alt={`${partner.name} logo`}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                  {partner.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{partner.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg">{getPartnerTypeIcon(partner.type)}</span>
                <span className="text-gray-400">{getPartnerTypeLabel(partner.type)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(partner.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Partner Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Partner Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400"
                placeholder="Enter partner name"
              />
            </div>

            {/* Logo URL */}
            <div>
              <label htmlFor="logo_url" className="block text-sm font-medium text-gray-300 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                id="logo_url"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-sm text-gray-400 mt-1">
                Optional: URL to the partner&apos;s logo image
              </p>
            </div>

            {/* Partner Type (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Partner Type</label>
              <div className="flex items-center space-x-2 p-3 bg-gray-700 border border-gray-600 rounded-lg">
                <span className="text-lg">{getPartnerTypeIcon(partner.type)}</span>
                <span className="text-white">{getPartnerTypeLabel(partner.type)}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Partner type cannot be changed after creation
              </p>
            </div>

            {/* Preview */}
            {formData.name && (
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {formData.logo_url ? (
                      <Image
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="h-16 w-16 rounded-lg object-cover"
                        onError={e => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{formData.name}</h4>
                    <p className="text-sm text-gray-400">{getPartnerTypeLabel(partner.type)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600">
              <Link
                href={`/dashboard/partners/${partnerId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || !formData.name}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
