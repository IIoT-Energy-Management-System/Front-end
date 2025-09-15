"use client"

import type React from "react"

import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const { isAuthenticated, checkAuthStatus, loadFactories, loadDevices, loadAlerts, loadSettings } = useAppStore()

  useEffect(() => {
    // Check if user is already logged in from localStorage
    checkAuthStatus()
  }, [checkAuthStatus])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Load initial data
    loadFactories()
    loadDevices()
    loadAlerts()
    loadSettings()
  }, [isAuthenticated, router, loadFactories, loadDevices, loadAlerts, loadSettings])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
