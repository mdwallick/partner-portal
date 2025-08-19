"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Music2 } from "lucide-react"

export default function NewSongPage() {
  const router = useRouter()
  const params = useParams()
  const partnerId = params.id as string
  const [name, setName] = useState("")
  const [genre, setGenre] = useState("")
  const [minutes, setMinutes] = useState("")
  const [seconds, setSeconds] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const m = Math.max(0, Math.floor(Number(minutes || 0)))
      const sClamped = Math.max(0, Math.min(59, Math.floor(Number(seconds || 0))))
      const duration_s = m * 60 + sClamped
      const res = await fetch(`/api/partners/${partnerId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, genre: genre || undefined, duration_s }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create song")
      }
      router.push(`/dashboard/partners/${partnerId}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href={`/dashboard/partners/${partnerId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Partner
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-orange-900 rounded-lg flex items-center justify-center">
                <Music2 className="h-6 w-6 text-orange-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Add New Song</h1>
              <p className="text-gray-400">Create a new song for this artist</p>
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter song name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select a genre</option>
                <option value="Pop">Pop</option>
                <option value="Rock">Rock</option>
                <option value="Hip-Hop">Hip-Hop</option>
                <option value="R&B">R&B</option>
                <option value="Electronic">Electronic</option>
                <option value="Country">Country</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    min={0}
                    value={minutes}
                    onChange={e => setMinutes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Minutes"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={seconds}
                    onChange={e => setSeconds(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Seconds"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Preview: {Math.max(0, Math.floor(Number(minutes || 0)))}:
                {String(Math.max(0, Math.min(59, Math.floor(Number(seconds || 0))))).padStart(
                  2,
                  "0"
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-700">
              <Link
                href={`/dashboard/partners/${partnerId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Song"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
