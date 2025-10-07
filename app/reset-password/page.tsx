"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserApiService } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

// Component riêng để handle search params với Suspense
function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)

  const router = useRouter()
  const { t } = useTranslation()

  // Get token and userId from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tokenParam = urlParams.get('token')
      const userIdParam = urlParams.get('userId')

      setToken(tokenParam)
      setUserId(userIdParam)

      if (!tokenParam || !userIdParam) {
        setError("Invalid reset link. Please request a new password reset.")
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin")
      return
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp")
      return
    }

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự")
      return
    }

    if (!token || !userId) {
      setError("Invalid reset link")
      return
    }

    setIsLoading(true)

    try {
      await UserApiService.resetPassword(token, userId, password)

      setSuccess(true)
      setTimeout(() => {
        router.push('/login?message=password-reset-success')
      }, 2000)
    } catch (err) {
    //   setError( "Lỗi không xác định. Vui lòng thử lại.")
      console.error("Error resetting password:", err)
      if (err.error && err.error.toLowerCase().includes("expired")) {
        setError("Reset link has expired. Please request a new password reset.")
        setExpired(true)
      } else {
        setError(err.error ||"Lỗi không xác định. Vui lòng thử lại.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (!userId) {
      setError("Invalid user. Cannot resend email.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await UserApiService.resendEmail(userId)
      setError("A new password reset email has been sent if the user exists.")
      setExpired(false)
    } catch (err) {
      console.error("Error resending password reset email:", err)
      setError(err.error || "Lỗi không xác định. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardDescription className="text-green-600 text-lg">
              ✅ Password reset successfully!
            </CardDescription>
            <p className="text-sm text-gray-600 mt-2">
              Redirecting to login page...
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
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
          <CardDescription>Đặt mật khẩu mới cho tài khoản của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Nhập lại mật khẩu"
              />
            </div>
            {error && <div className="text-sm text-red-600 text-center">{error}</div>}
            {expired ? (
              <div className="text-sm text-red-600 text-center">
                Your reset link has expired. Please{" "}
                <a onClick={handleResendEmail} className="text-blue-600 underline">
                  request a new password reset
                </a>
                .
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={isLoading || !token || !userId}>
              {isLoading ? "Đang xử lý..." : "Đặt mật khẩu mới"}
            </Button>
          </form>
          <div className="mt-4 text-xs text-center text-gray-500">
            Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}