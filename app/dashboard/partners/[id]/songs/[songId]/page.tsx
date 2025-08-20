"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit, Trash2, Music, Play, Clock, TrendingUp } from "lucide-react"
import toast from "react-hot-toast"

interface Song {
  id: string
  name: string
  genre?: string
  duration_s?: number
  play_count: number
  created_at: string
  partner_id: string
  partner_name: string
  partner_type: string
  userCanAdmin?: boolean
}

export default function SongDetailPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  const songId = params.songId as string

  const [song, setSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isLoading && user && partnerId && songId) {
      const fetchSongData = async () => {
        try {
          setLoading(true)

          // Fetch song details
          const songResponse = await fetch(`/api/partners/${partnerId}/songs/${songId}`)
          if (songResponse.ok) {
            const songData = await songResponse.json()
            setSong(songData)
          } else {
            setError("Song not found")
          }
        } catch (error) {
          console.error("Error fetching song data:", error)
          setError("Failed to load song data")
        } finally {
          setLoading(false)
        }
      }

      fetchSongData()
    }
  }, [user, isLoading, partnerId, songId])

  const handleDeleteSong = async () => {
    if (!confirm("Are you sure you want to delete this song? This action cannot be undone.")) {
      return
    }

    try {
      setDeleting(true)
      const response = await fetch(`/api/partners/${partnerId}/songs/${songId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Song deleted successfully")
        router.push(`/dashboard/partners/${partnerId}/songs`)
      } else {
        setError("Failed to delete song")
      }
    } catch (error) {
      console.error("Error deleting song:", error)
      setError("Failed to delete song")
    } finally {
      setDeleting(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
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

  if (error || !song) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Song Not Found</h1>
          <p className="text-gray-400 mb-6">{error || "The requested song could not be found."}</p>
          <Link
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Back to Songs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Songs
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{song.name}</h1>
              <p className="text-gray-400 mt-2">
                by {song.partner_name} • {song.genre || "No genre"}
              </p>
            </div>

            {song.userCanAdmin && (
              <div className="flex items-center space-x-3">
                <Link
                  href={`/dashboard/partners/${partnerId}/songs/${songId}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Song
                </Link>
                <button
                  onClick={handleDeleteSong}
                  disabled={deleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Song
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Song Info Card */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="h-24 w-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-4xl font-bold">
                🎵
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Song Details</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-400">Name</dt>
                      <dd className="text-white font-medium">{song.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-400">Genre</dt>
                      <dd className="text-white">{song.genre || "Not specified"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-400">Duration</dt>
                      <dd className="text-white">
                        {song.duration_s ? formatDuration(song.duration_s) : "Not specified"}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-2">Statistics</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-400">Play Count</dt>
                      <dd className="text-white font-medium">{song.play_count.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-400">Created</dt>
                      <dd className="text-white">
                        {new Date(song.created_at).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-400">Partner</dt>
                      <dd className="text-white">{song.partner_name}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-900 rounded-lg flex items-center justify-center">
                  <Play className="h-4 w-4 text-purple-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Plays</p>
                <p className="text-2xl font-bold text-white">{song.play_count.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-900 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Duration</p>
                <p className="text-2xl font-bold text-white">
                  {song.duration_s ? formatDuration(song.duration_s) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Status</p>
                <p className="text-2xl font-bold text-white">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        {song.userCanAdmin && (
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Song Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href={`/dashboard/partners/${partnerId}/songs/${songId}/edit`}
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Song Details
              </Link>
              <button
                onClick={handleDeleteSong}
                disabled={deleting}
                className="inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Song
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
