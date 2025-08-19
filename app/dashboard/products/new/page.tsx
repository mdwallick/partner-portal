"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingBag } from "lucide-react"

type PartnerLite = {
  id: string
  name: string
  type: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<PartnerLite[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [partnerId, setPartnerId] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const res = await fetch("/api/partners", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load partners")
        const data = await res.json()
        const artistsOnly = Array.isArray(data)
          ? data.filter((p: any) => p.type === "merch_supplier" || p.type === "artist")
          : []
        setPartners(artistsOnly)
        if (artistsOnly.length > 0) setPartnerId(artistsOnly[0].id)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    loadPartners()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (!partnerId) throw new Error("Please select a partner")
      const res = await fetch(`/api/partners/${partnerId}/skus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: category || undefined,
          image_url: imageUrl || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create product")
      }
      router.push("/dashboard/products")
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-orange-900 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Add New Product</h1>
              <p className="text-gray-400">Create a new product for a partner</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Partner *</label>
              <select
                value={partnerId}
                onChange={e => setPartnerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              >
                <option value="" disabled>
                  Select a partner
                </option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type === "merch_supplier" ? "Merch" : "Artist"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Apparel, Vinyl, Poster"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
              <Link
                href="/dashboard/products"
                className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
