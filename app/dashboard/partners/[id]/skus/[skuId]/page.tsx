"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, ShoppingBag } from "lucide-react"
import Image from "next/image"

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

export default function ProductDetailPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  const skuId = params.skuId as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [sku, setSku] = useState<SKU | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && user && partnerId && skuId) {
      const fetchSkuData = async () => {
        try {
          setLoading(true)

          // Fetch partner details
          const partnerResponse = await fetch(`/api/partners/${partnerId}`)
          if (partnerResponse.ok) {
            const partnerData = await partnerResponse.json()
            setPartner(partnerData)
          }

          // Fetch SKU details
          const skuResponse = await fetch(`/api/partners/${partnerId}/skus/${skuId}`)
          if (skuResponse.ok) {
            const skuData = await skuResponse.json()
            setSku(skuData)
          } else {
            setError("SKU not found")
          }
        } catch (error) {
          console.error("Error fetching SKU data:", error)
          setError("Failed to load SKU data")
        } finally {
          setLoading(false)
        }
      }

      fetchSkuData()
    }
  }, [user, isLoading, partnerId, skuId])

  const handleDeleteSku = async () => {
    if (!confirm("Are you sure you want to delete this SKU? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/partners/${partnerId}/skus/${skuId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push(`/dashboard/partners/${partnerId}`)
      } else {
        setError("Failed to delete SKU")
      }
    } catch (error) {
      console.error("Error deleting SKU:", error)
      setError("Failed to delete SKU")
    }
  }

  const getCategoryLabel = (category?: string) => {
    if (!category) return "No category"
    return category.charAt(0).toUpperCase() + category.slice(1)
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {partner.name}
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {sku.product_image_url ? (
                  <Image
                    src={sku.product_image_url}
                    alt={`${sku.name} image`}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold">
                    🛍️
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{sku.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg text-gray-600">{getCategoryLabel(sku.category)}</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sku.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {sku.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Created {new Date(sku.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href={`/dashboard/partners/${partnerId}/skus/${skuId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Link>
              <button
                onClick={handleDeleteSku}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Product Status</p>
                <p className="text-2xl font-bold text-gray-900">{sku.status}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📦</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-2xl font-bold text-gray-900">{getCategoryLabel(sku.category)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">📅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Date(sku.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Product Name</h3>
              <p className="text-lg text-gray-900">{sku.name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Category</h3>
              <p className="text-lg text-gray-900">{getCategoryLabel(sku.category)}</p>
            </div>

            {sku.series && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Series</h3>
                <p className="text-lg text-gray-900">{sku.series}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                  sku.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {sku.status}
              </span>
            </div>
          </div>

          {sku.product_image_url && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Product Image</h3>
              <Image
                src={sku.product_image_url}
                alt={sku.name}
                className="h-48 w-48 rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
