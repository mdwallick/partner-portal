"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useState, useEffect } from "react"
import { ChevronUp, ChevronDown, Copy, Eye, EyeOff, Eye as EyeIcon } from "lucide-react"

// Function to decode JWT
function decodeJWT(token: string) {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) {
      return null
    }

    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")))
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))

    return { header, payload }
  } catch (error) {
    console.error("Error decoding JWT:", error)
    return null
  }
}

export default function TokenDebugger() {
  const { user, isLoading } = useUser()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showTokens, setShowTokens] = useState(true)
  const [showDecoded, setShowDecoded] = useState(true)
  const [tokens, setTokens] = useState<{
    idToken?: string
    accessToken?: string
    refreshToken?: string
  }>({})

  useEffect(() => {
    if (user) {
      console.log("🔐 User authenticated:", user.email)

      // Fetch tokens from our debug API
      const fetchTokens = async () => {
        try {
          const response = await fetch("/api/debug-session")
          if (response.ok) {
            const data = await response.json()
            console.log("🔐 Tokens fetched successfully:", data)

            setTokens({
              idToken: data.tokens?.idToken || "Not available",
              accessToken: data.tokens?.accessToken || "Not available",
              refreshToken: data.tokens?.refreshToken || "Not available",
            })
          } else {
            console.error("🔐 Failed to fetch tokens:", response.status, response.statusText)
            setTokens({
              idToken: "Failed to fetch",
              accessToken: "Failed to fetch",
              refreshToken: "Failed to fetch",
            })
          }
        } catch (error) {
          console.error("🔐 Error fetching tokens:", error)
          setTokens({
            idToken: "Error fetching",
            accessToken: "Error fetching",
            refreshToken: "Error fetching",
          })
        }
      }

      fetchTokens()
    }
  }, [user])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
    console.log(`${type} copied to clipboard`)
  }

  const formatToken = (token: string) => {
    if (
      !token ||
      token === "Not available" ||
      token === "Failed to fetch" ||
      token === "Error fetching token"
    ) {
      return token
    }

    if (showTokens) {
      return token
    } else {
      return token.substring(0, 20) + "..." + token.substring(token.length - 20)
    }
  }

  if (isLoading || !user) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gray-900 text-white border-t border-gray-700">
        {/* Header */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setIsExpanded(prev => !prev)
            }
          }}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">🔐 Auth0 Token Debugger</span>
            <span className="text-xs text-gray-400">
              {user.email} ({user.sub})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={e => {
                e.stopPropagation()
                setShowTokens(!showTokens)
              }}
              className="p-1 hover:bg-gray-700 rounded"
              title={showTokens ? "Hide tokens" : "Show tokens"}
            >
              {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <span aria-hidden="true">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </span>
          </div>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {/* ID Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-300">ID Token</label>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setShowDecoded(!showDecoded)
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title={showDecoded ? "Hide decoded" : "Show decoded"}
                  >
                    <EyeIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(tokens.idToken || "", "ID Token")}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Copy ID Token"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-800 p-2 rounded text-xs font-mono break-all">
                {formatToken(tokens.idToken || "")}
              </div>
              {showDecoded &&
                tokens.idToken &&
                tokens.idToken !== "Not available" &&
                tokens.idToken !== "Failed to fetch" &&
                tokens.idToken !== "Error fetching" && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Decoded ID Token:</div>
                    <div className="bg-gray-900 p-2 rounded text-xs">
                      <div className="text-yellow-300 mb-1">Header:</div>
                      <pre className="text-green-300 overflow-auto">
                        {JSON.stringify(decodeJWT(tokens.idToken)?.header, null, 2)}
                      </pre>
                      <div className="text-yellow-300 mb-1 mt-2">Payload:</div>
                      <pre className="text-blue-300 overflow-auto">
                        {JSON.stringify(decodeJWT(tokens.idToken)?.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>

            {/* Access Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-300">Access Token</label>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setShowDecoded(!showDecoded)
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title={showDecoded ? "Hide decoded" : "Show decoded"}
                  >
                    <EyeIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(tokens.accessToken || "", "Access Token")}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Copy Access Token"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-800 p-2 rounded text-xs font-mono break-all">
                {formatToken(tokens.accessToken || "")}
              </div>
              {showDecoded &&
                tokens.accessToken &&
                tokens.accessToken !== "Not available" &&
                tokens.accessToken !== "Failed to fetch" &&
                tokens.accessToken !== "Error fetching" && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Decoded Access Token:</div>
                    <div className="bg-gray-900 p-2 rounded text-xs">
                      <div className="text-yellow-300 mb-1">Header:</div>
                      <pre className="text-green-300 overflow-auto">
                        {JSON.stringify(decodeJWT(tokens.accessToken)?.header, null, 2)}
                      </pre>
                      <div className="text-yellow-300 mb-1 mt-2">Payload:</div>
                      <pre className="text-blue-300 overflow-auto">
                        {JSON.stringify(decodeJWT(tokens.accessToken)?.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>

            {/* Refresh Token */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-300">Refresh Token</label>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setShowDecoded(!showDecoded)
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                    title={showDecoded ? "Hide decoded" : "Show decoded"}
                  >
                    <EyeIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(tokens.refreshToken || "", "Refresh Token")}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="Copy Refresh Token"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-800 p-2 rounded text-xs font-mono break-all">
                {formatToken(tokens.refreshToken || "")}
              </div>
              {showDecoded &&
                tokens.refreshToken &&
                tokens.refreshToken !== "Not available" &&
                tokens.refreshToken !== "Failed to fetch" &&
                tokens.refreshToken !== "Error fetching" && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">Decoded Refresh Token:</div>
                    <div className="bg-gray-900 p-2 rounded text-xs">
                      <div className="text-yellow-300 mb-1">Header:</div>
                      <pre className="text-green-300 overflow-auto">
                        {JSON.stringify(decodeJWT(tokens.refreshToken)?.header, null, 2)}
                      </pre>
                      <div className="text-yellow-300 mb-1 mt-2">Payload:</div>
                      <pre className="text-blue-300 overflow-auto">
                        {JSON.stringify(decodeJWT(tokens.refreshToken)?.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
            </div>

            {/* User Info */}
            <div className="pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400">
                <div>
                  <strong>User ID:</strong> {user.sub}
                </div>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Name:</strong> {user.name || "Not provided"}
                </div>
                <div>
                  <strong>Email Verified:</strong> {user.email_verified ? "Yes" : "No"}
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="pt-2 border-t border-gray-700">
              <div className="text-xs text-green-300">
                <div>
                  <strong>✅ Tokens are now live from /api/debug-session!</strong>
                </div>
                <div>🔑 Copy the Access Token above to use in your API calls</div>
                <div>
                  📋 Use in Authorization header:{" "}
                  <code className="bg-gray-800 px-1 rounded">Bearer &lt;accessToken&gt;</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
