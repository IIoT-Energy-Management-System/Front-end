"use client"

import type React from "react"

import { useAppStore } from "@/lib/store"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar, navigation } from "./sidebar"
import { authService } from "@/lib/auth"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, checkAuthStatus, isCheckingAuth } = useAppStore()
    const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [hasAccess, setHasAccess] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      checkAuthStatus()
    }
  }, [checkAuthStatus])

  useEffect(() => {
    if (!isCheckingAuth && !isAuthenticated || pathname === "/") {
      router.push("/login")
      return
    }

    if (!isCheckingAuth && isAuthenticated) {
      const currentRoute = navigation.find(item => item.href === pathname)
      if (currentRoute && currentRoute.permission) {
        const access = authService.hasPermission(currentRoute.permission)
        setHasAccess(access)
        if (!access) {
          router.push("/dashboard")
        }
      }
      setIsCheckingAccess(false)
    }
  }, [isAuthenticated, isCheckingAuth, pathname, router])

  if (isCheckingAuth || isCheckingAccess) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
        <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin ml-4"></div>
    </div>
  }

  if (!isAuthenticated || !hasAccess) {
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
