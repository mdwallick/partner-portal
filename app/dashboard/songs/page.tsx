"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Gamepad2, Plus, Edit, Trash2 } from "lucide-react"
import { Song } from "@/lib/types"
import Image from "next/image"

export default function GamesPage() {
  const { user, isLoading } = useUser()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && user) {
      fetchGames()
    }
  }, [user, isLoading])

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/songs")
      if (response.ok) {
        const data = await response.json()
        setSongs(data)
      }
    } catch (error) {
      console.error("Error fetching games:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGame = async (songId: string) => {
    if (!confirm("Are you sure you want to revoke this game?")) {
      return
    }

    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        setSongs(songs.filter(song => song.id !== songId))
      }
    } catch (error) {
      console.error("Error deleting game:", error)
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
      {songs.length === 0 ? (
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
          {songs.map(song => (
            <div key={song.id} className="card">
              <div className="flex items-start justify-between mb-4">
                {song.picture_url ? (
                  <Image
                    src={song.picture_url}
                    alt={song.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Gamepad2 className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/songs/${song.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteGame(song.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">{song.name}</h3>

              {song.genre && <p className="text-sm text-gray-600 mb-2">Genre: {song.genre}</p>}

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Stream Count: {song.stream_count || 0}</span>
                <span>Created: {new Date(song.created_at).toLocaleDateString()}</span>
              </div>

              <div className="flex space-x-2">
                <Link
                  href={`/dashboard/songs/${song.id}`}
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
