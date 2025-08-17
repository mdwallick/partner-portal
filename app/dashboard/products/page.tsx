"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, Plus, Edit, Archive } from "lucide-react"
import Image from "next/image"

interface Sku {
  id: string
  partner_id: string
  name: string
  category?: string
  series?: string
  product_image_url?: string
  created_at: Date
  updated_at: Date
  status: string
}

export default function ProductsPage() {
  const { user, isLoading } = useUser()
  const [skus, setSkus] = useState<Sku[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && user) {
      fetchSkus()
    }
  }, [user, isLoading])

  const fetchSkus = async () => {
    try {
      const response = await fetch("/api/sku")
      if (response.ok) {
        const data = await response.json()
        setSkus(data)
      }
    } catch (error) {
      console.error("Error fetching SKUs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveSku = async (skuId: string) => {
    if (!confirm("Are you sure you want to archive this product?")) {
      return
    }

    try {
      const response = await fetch(`/api/sku/${skuId}`)

      if (response.ok) {
        setSkus(skus.map(sku => (sku.id === skuId ? { ...sku, status: "archived" } : sku)))
      }
    } catch (error) {
      console.error("Error archiving SKU:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        )
      case "inactive":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Inactive
          </span>
        )
      case "archived":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Archived
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product catalog</p>
        </div>
        <Link href="/dashboard/products/new" className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Products Grid */}
      {skus.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first product</p>
          <Link href="/dashboard/products/new" className="btn-primary">
            Create Your First Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skus.map(sku => (
            <div key={sku.id} className="card">
              <div className="flex items-start justify-between mb-4">
                {sku.product_image_url ? (
                  <Image
                    src={sku.product_image_url}
                    alt={sku.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/products/${sku.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleArchiveSku(sku.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{sku.name}</h3>

              <div className="space-y-2 mb-4">
                {sku.category && <p className="text-sm text-gray-600">Category: {sku.category}</p>}
                {sku.series && <p className="text-sm text-gray-600">Series: {sku.series}</p>}
                <div className="flex items-center justify-between">
                  {getStatusBadge(sku.status)}
                  <span className="text-sm text-gray-500">
                    {new Date(sku.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/products/${sku.id}`}
                  className="btn-primary flex-1 text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
