"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/lib/i18n"
import { useAppStore } from "@/lib/store"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("admin@email.com")
  const [password, setPassword] = useState("123456")
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated } = useAppStore()
  const { t } = useTranslation()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  // Check for success message from reset password
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password-reset-success') {
      setSuccessMessage("Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập với mật khẩu mới.")
      // Clear the message from URL
      router.replace('/login')
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(email, password, rememberMe)
      if (success) {
        router.push("/dashboard")
      } else {
        setError(t("auth.invalidCredentials"))
      }
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        {/*<CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Factory className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">IIoT Energy Platform</CardTitle>
          <CardDescription>{t("auth.login")} vào hệ thống quản lý điện năng</CardDescription>
        </CardHeader>*/}
        <CardHeader className="text-center">
          <div style={{ display: "block", margin: "auto", width: "250px" }} className="flex justify-center mb-4 h-30 w-40 overflow-hidden rounded">
            <img
              src="https://new-ocean.com.vn/wp-content/uploads/2021/12/z3070143378207_42659dfb864677b5188fb31a5e889811.jpg.webp"
              alt="IIoT Logo"
              className="h-full w-full object-cover object-center" 
              style={{
                    width: "500px",
                    height: "100px",
                    objectFit: "cover",
                    objectPosition: "center"
                }}
            />
          </div>
          {/*<CardTitle className="text-2xl font-bold">IIoT Energy Platform</CardTitle>*/}
          <CardDescription>{t("auth.login")} vào hệ thống quản lý điện năng</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {successMessage && <div className="text-sm text-green-600 text-center bg-green-50 p-2 rounded">{successMessage}</div>}
            {error && <div className="text-sm text-red-600 text-center">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("auth.loginButton")}
            </Button>
          </form>
          <div className="mt-4 text-xs text-center text-gray-500">Demo credentials: admin@email.com / 123456</div>
        </CardContent>
      </Card>
    </div>
  )
}
