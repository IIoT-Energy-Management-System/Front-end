"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/lib/i18n"
import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin123")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const { login, isAuthenticated } = useAppStore()
  const { t } = useTranslation()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(username, password, rememberMe)
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
              <Label htmlFor="username">{t("auth.username")}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal">
                Ghi nhớ đăng nhập
              </Label>
            </div>
            {error && <div className="text-sm text-red-600 text-center">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("auth.loginButton")}
            </Button>
          </form>
          <div className="mt-4 text-xs text-center text-gray-500">Demo credentials: admin / admin123</div>
        </CardContent>
      </Card>
    </div>
  )
}
