"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Music } from "lucide-react"
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
  userCanAdmin: boolean
}

interface Partner {
  id: string
  name: string
  type: "artist" | "merch_supplier"
}

export default function EditSongPage() {
  const { user, isLoading } = useUser()
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string
  const songId = params.songId as string

  const [_partner, setPartner] = useState<Partner | null>(null)
  const [song, setSong] = useState<Song | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    genre: "",
    duration_s: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [canView, setCanView] = useState(false)
  const [canAdmin, setCanAdmin] = useState(false)

  useEffect(() => {
    if (!isLoading && user && partnerId && songId) {
      const fetchData = async () => {
        try {
          setLoading(true)

          // Fetch song details (includes partner info)
          const songResponse = await fetch(`/api/partners/${partnerId}/songs/${songId}`, {
            headers: { "Content-Type": "application/json" },
          })
          if (songResponse.ok) {
            const songData = await songResponse.json()
            setSong(songData)
            setFormData({
              name: songData.name,
              genre: songData.genre || "",
              duration_s: songData.duration_s ? songData.duration_s.toString() : "",
            })

            // Set partner info from song response
            setPartner({
              id: songData.partner_id,
              name: songData.partner_name,
              type: songData.partner_type,
            })

            // Set permissions based on song data response
            setCanView(true) // If we got the song data, user can view
            setCanAdmin(songData.userCanAdmin || false) // Set admin permission from response
          } else {
            setError("Song not found")
          }
        } catch (error) {
          console.error("Error fetching data:", error)
          setError("Failed to load data")
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }
  }, [user, isLoading, partnerId, songId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/partners/${partnerId}/songs/${songId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Song updated successfully!")
        router.push(`/dashboard/partners/${partnerId}/songs/${songId}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update song")
      }
    } catch (error) {
      console.error("Error updating song:", error)
      setError("An error occurred while updating the song")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
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
            href={`/dashboard/partners/${partnerId}/songs`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Back to Songs
          </Link>
        </div>
      </div>
    )
  }

  // If user can't view, show access denied
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don&apos;t have permission to view this song.</p>
          <Link
            href={`/dashboard/partners/${partnerId}/songs`}
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/partners/${partnerId}/songs/${songId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Song
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit Song</h1>
          <p className="text-gray-400 mt-2">Update song information</p>
        </div>

        {/* Song Info */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                🎵
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{song.name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg">🎵</span>
                <span className="text-gray-400">{song.genre || "No genre"}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(song.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                {song.duration_s ? formatDuration(song.duration_s) : "No duration"} •{" "}
                {song.play_count} play{song.play_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
          {!canAdmin && (
            <div className="bg-yellow-900 border border-yellow-700 rounded-md p-4 mb-6">
              <p className="text-yellow-200 text-sm">
                You have view-only access to this song. Contact an administrator to make changes.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900 border border-red-700 rounded-md p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Song Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Song Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={!canAdmin}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter song name"
              />
            </div>

            {/* Genre */}
            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <input
                type="text"
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                disabled={!canAdmin}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., Rock, Pop, Jazz, Electronic"
              />
              <p className="mt-1 text-sm text-gray-400">Optional: Musical genre or style</p>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration_s" className="block text-sm font-medium text-gray-300 mb-2">
                Duration (seconds)
              </label>
              <input
                type="number"
                id="duration_s"
                name="duration_s"
                value={formData.duration_s}
                onChange={handleInputChange}
                min="0"
                step="1"
                disabled={!canAdmin}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="180"
              />
              <p className="mt-1 text-sm text-gray-400">
                Optional: Duration in seconds (e.g., 180 for 3:00)
              </p>
            </div>

            {/* Preview */}
            {formData.name && (
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Preview</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                      🎵
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{formData.name}</h4>
                    <p className="text-sm text-gray-400">
                      {formData.genre || "No genre"} •{" "}
                      {formData.duration_s
                        ? formatDuration(parseInt(formData.duration_s))
                        : "No duration"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions - Only show if user can admin */}
            {canAdmin && (
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600">
                <Link
                  href={`/dashboard/partners/${partnerId}/songs/${songId}`}
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
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
