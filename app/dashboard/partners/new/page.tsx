"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { useUser } from "@auth0/nextjs-auth0"
import Image from "next/image"

export default function NewPartnerPage() {
  const { user, isLoading } = useUser()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    type: "artist" as "artist" | "merch_supplier",
    logo_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/partners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const newPartner = await response.json()
        router.push(`/dashboard/partners/${newPartner.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create partner")
      }
    } catch (error) {
      console.error("Error creating partner:", error)
      setError("An error occurred while creating the partner")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
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
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/partners"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partners
          </Link>
          <h1 className="text-3xl font-bold text-white">Create New Partner</h1>
          <p className="text-gray-400 mt-2">Add a new partner organization to the platform</p>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-4">
                <p className="text-red-300 text-sm">{error}</p>
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
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter partner name"
              />
            </div>

            {/* Partner Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                Partner Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="artist">Artist</option>
                <option value="merch_supplier">Merch Supplier</option>
              </select>
              <p className="text-sm text-gray-400 mt-1">
                {formData.type === "artist"
                  ? "Artists can create and manage albums and songs"
                  : "Merch Suppliers can create and manage SKUs"}
              </p>
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
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-sm text-gray-400 mt-1">
                Optional: URL to the artist&apos;s logo image
              </p>
            </div>

            {/* Preview */}
            {formData.name && (
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 relative">
                    {formData.logo_url ? (
                      <Image
                        src={formData.logo_url}
                        alt="Logo preview"
                        className="h-16 w-16 rounded-lg object-cover"
                        onError={e => {
                          // Hide the broken image and show fallback
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-16 w-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold ${formData.logo_url ? "hidden" : ""}`}
                    >
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{formData.name}</h4>
                    <p className="text-sm text-gray-400 capitalize">
                      {formData.type.replace("_", " ")} Partner
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
              <Link
                href="/dashboard/partners"
                className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !formData.name}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create Partner
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
