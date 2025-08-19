"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShoppingBag, Upload } from "lucide-react"

interface Partner {
  id: string
  name: string
  type: "artist" | "merch_supplier"
  logo_url?: string
}

interface SKU {
  id: string
  name: string
  category?: string
  series?: string
  product_image_url?: string
  created_at: string
  status: string
}

export default function EditProductPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  const skuId = params.skuId as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [sku, setSku] = useState<SKU | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    image_url: "",
    status: "active",
  })

  useEffect(() => {
    if (!isLoading && user && partnerId && skuId) {
      const fetchProductData = async () => {
        try {
          setLoading(true)

          // Fetch partner details
          const partnerResponse = await fetch(`/api/partners/${partnerId}`)
          if (partnerResponse.ok) {
            const partnerData = await partnerResponse.json()
            setPartner(partnerData)
          } else {
            setError("Partner not found")
            return
          }

          // Fetch product details
          const skuResponse = await fetch(`/api/partners/${partnerId}/skus/${skuId}`)
          if (skuResponse.ok) {
            const skuData = await skuResponse.json()
            setSku(skuData)

            // Populate form with existing data
            setFormData({
              name: skuData.name || "",
              category: skuData.category || "",
              image_url: skuData.product_image_url || "",
              status: skuData.status || "active",
            })
          } else {
            setError("Product not found")
            return
          }
        } catch (error) {
          console.error("Error fetching product data:", error)
          setError("Failed to load product data")
        } finally {
          setLoading(false)
        }
      }

      fetchProductData()
    }
  }, [user, isLoading, partnerId, skuId])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("Product name is required")
      return
    }

    try {
      setSubmitting(true)
      setError("")

      const response = await fetch(`/api/partners/${partnerId}/skus/${skuId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const _updatedProduct = await response.json()
        router.push(`/dashboard/partners/${partnerId}/skus/${skuId}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update product")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      setError("Failed to update product")
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to access the partner portal.</p>
        </div>
      </div>
    )
  }

  if (error || !partner || !sku) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">
            {error || "The requested product could not be found."}
          </p>
          <Link
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Partner
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/partners/${partnerId}/skus/${skuId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {sku.name}
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600">
                Update {sku.name} for {partner.name}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Product Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="input"
                placeholder="Enter product name"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select category</option>
                <option value="clothing">Clothing</option>
                <option value="accessories">Accessories</option>
                <option value="collectibles">Collectibles</option>
                <option value="posters">Posters</option>
                <option value="figures">Figures</option>
                <option value="books">Books</option>
                <option value="electronics">Electronics</option>
                <option value="home-decor">Home Decor</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                Product Image URL
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="input flex-1"
                  placeholder="https://example.com/product-image.jpg"
                />
                <div className="flex-shrink-0">
                  <Upload className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Provide a direct link to the product&apos;s image
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href={`/dashboard/partners/${partnerId}/skus/${skuId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Update Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
