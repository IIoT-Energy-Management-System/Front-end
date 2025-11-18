"use client"

import { useAppStore } from "@/lib/store"
import { useEffect, useState } from "react"

/**
 * Example component showing how to initialize auth on page load
 * 
 * Usage: Add this init logic to your root layout or main pages
 */
export default function ExampleAuthInit() {
  const { accessToken, user, isLoading, refresh, fetchMe } = useAppStore()
  const [starting, setStarting] = useState(true)

  const init = async () => {
    // Có thể xảy ra khi refresh trang
    if (!accessToken) {
      await refresh()
    }

    if (accessToken && !user) {
      await fetchMe()
    }

    setStarting(false)
  }

  useEffect(() => {
    init()
  }, [])

  if (starting || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Initialized</h1>
      {user ? (
        <div>
          <p>Welcome, {user.username}!</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
        </div>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  )
}
