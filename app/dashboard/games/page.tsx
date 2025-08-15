"use client"

import { useOktaAuth } from "@/lib/use-okta-auth"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Gamepad2, Plus, Edit, Trash2, Smartphone, Globe, Monitor } from "lucide-react"
import { Game } from "@/lib/database"

export default function GamesPage() {
  const { user, isLoading } = useOktaAuth()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && user) {
      fetchGames()
    }
  }, [user, isLoading])

  const fetchGames = async () => {
    try {
      // Get the access token from the API
      const tokenResponse = await fetch("/api/auth/token")
      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token")
      }

      const { accessToken } = await tokenResponse.json()

      const response = await fetch("/api/games", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setGames(data)
      }
    } catch (error) {
      console.error("Error fetching games:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("Are you sure you want to revoke this game?")) {
      return
    }

    try {
      // Get the access token
      const tokenResponse = await fetch("/api/auth/token")
      if (!tokenResponse.ok) {
        throw new Error("Failed to get access token")
      }

      const { accessToken } = await tokenResponse.json()

      const response = await fetch(`/api/games/${gameId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        setGames(games.filter(game => game.id !== gameId))
      }
    } catch (error) {
      console.error("Error deleting game:", error)
    }
  }

  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case "native_mobile_android":
      case "native_mobile_ios":
        return <Smartphone className="h-4 w-4" />
      case "web":
        return <Globe className="h-4 w-4" />
      case "M2M":
        return <Monitor className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
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
          <h1 className="text-2xl font-bold text-gray-900">Games</h1>
          <p className="text-gray-600">Manage your game portfolio</p>
        </div>
        <Link href="/dashboard/games/new" className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Game</span>
        </Link>
      </div>

      {/* Games Grid */}
      {games.length === 0 ? (
        <div className="card text-center py-12">
          <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No games yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first game</p>
          <Link href="/dashboard/games/new" className="btn-primary">
            Create Your First Game
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <div key={game.id} className="card">
              <div className="flex items-start justify-between mb-4">
                {game.picture_url ? (
                  <img
                    src={game.picture_url}
                    alt={game.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Gamepad2 className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/games/${game.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{game.name}</h3>

              {game.type && <p className="text-sm text-gray-600 mb-2">Type: {game.type}</p>}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Client IDs: {game.client_count || 0}</span>
                <span>Created: {new Date(game.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/games/${game.id}/clients`}
                  className="btn-secondary flex-1 text-center"
                >
                  Manage Clients
                </Link>
                <Link
                  href={`/dashboard/games/${game.id}`}
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
