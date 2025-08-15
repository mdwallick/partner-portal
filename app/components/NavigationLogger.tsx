"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

export default function NavigationLogger() {
  const pathname = usePathname()

  useEffect(() => {
    // Send navigation to server to log in terminal
    fetch("/api/log-navigation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pathname }),
    }).catch(error => {
      // Silently fail if logging fails
      console.error("Failed to log navigation:", error)
    })
  }, [pathname])

  return null // This component doesn't render anything
}
