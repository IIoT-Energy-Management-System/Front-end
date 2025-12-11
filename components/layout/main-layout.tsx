"use client"

import type React from "react"

import { authService } from "@/lib/auth"
import { useAppStore } from "@/lib/store"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar, navigation } from "./sidebar"

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
    // Chờ auth check hoàn thành trước
    if (isCheckingAuth) {
      return
    }

    // Redirect về login nếu chưa authenticated
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Kiểm tra quyền truy cập cho route hiện tại
    const currentRoute = navigation.find(item => item.href === pathname)
    if (currentRoute && currentRoute.permission) {
      const access = authService.hasPermission(currentRoute.permission)
      setHasAccess(access)
      if (!access) {
        router.push("/dashboard")
      }
    }
    setIsCheckingAccess(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
