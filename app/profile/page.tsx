"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUserApi } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import { useAppStore } from "@/lib/store"
import { Clock, Eye, EyeOff, Globe, Lock, Save, User as UserIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, updateUser } = useAppStore()
  const { t } = useTranslation()
  const { updateProfile , changePassword } = useUserApi()

  // Profile form state
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    language: "en" as "en" | "vi",
    timezone: "Asia/Ho_Chi_Minh"
  })

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || "",
        email: user.email || "",
        language: user.language || "en",
        timezone: user.timezone || "Asia/Ho_Chi_Minh"
      })
    }
  }, [user])

  const handleProfileUpdate = async () => {
    if (!user?.id) return

    setIsLoading(true)
    try {
      await updateProfile(user.id, {
        username: profileData.username,
        email: profileData.email,
        language: profileData.language,
        timezone: profileData.timezone
      })

      // Update local store
      updateUser({
        username: profileData.username,
        email: profileData.email,
        language: profileData.language,
        timezone: profileData.timezone
      })

      toast.success(t("profile.updateSuccess"))
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error(t("profile.updateError"))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t("profile.passwordMismatch"))
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"))
      return
    }
    
    if (!user?.id) return

    setIsPasswordLoading(true)
    try {
      await changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      toast.success(t("profile.passwordChangeSuccess"))

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error) {
      console.error("Failed to change password:", error)
      toast.error(t("profile.passwordChangeError"), { description: (error as any).error || "" })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const timezones = [
    { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho Chi Minh (GMT+7)" },
    { value: "Asia/Bangkok", label: "Asia/Bangkok (GMT+7)" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (GMT+9)" },
    { value: "America/New_York", label: "America/New York (GMT-5)" },
    { value: "Europe/London", label: "Europe/London (GMT+0)" },
    { value: "UTC", label: "UTC (GMT+0)" }
  ]

  return (
    <MainLayout>
      <div className="space-y-6 p-2 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-center sm:text-left text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t("profile.title")}
            </h1>
            <p className="text-gray-600 mt-2">{t("profile.description")}</p>
          </div>
        </div>

        {/* Profile Content */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              {t("profile.personalInfo")}
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t("profile.changePassword")}
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                  {t("profile.personalInfo")}
                </CardTitle>
                <CardDescription>
                  {t("profile.personalInfoDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">{t("profile.username")}</Label>
                    <Input
                      id="username"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      className="border-2 border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("profile.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="border-2 border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor="language">{t("profile.language")}</Label>
                    <Select
                      value={profileData.language}
                      onValueChange={(value: "en" | "vi") => setProfileData(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger className="border-2 border-blue-200 focus:border-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">{t("common.english")}</SelectItem>
                        <SelectItem value="vi">{t("common.vietnamese")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timezone */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone">{t("profile.timezone")}</Label>
                    <Select
                      value={profileData.timezone}
                      onValueChange={(value) => setProfileData(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger className="border-2 border-blue-200 focus:border-blue-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* User Info Display */}
                <div className="mt-6 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                  <h3 className="font-semibold text-gray-800 mb-3">{t("profile.accountInfo")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                        {user?.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user?.isActive ? "default" : "secondary"} className={user?.isActive ? "bg-green-500" : ""}>
                        {user?.isActive ? t("profile.active") : t("profile.inactive")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {t("profile.createdAt")}: {user?.createdAt ? new Date(user.createdAt).toLocaleString() : t("common.unknown")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {t("profile.lastLogin")}: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : t("common.unknown")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleProfileUpdate}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Change Password Tab */}
          <TabsContent value="password" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  {t("profile.changePassword")}
                </CardTitle>
                <CardDescription>
                  {t("profile.changePasswordDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t("profile.currentPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="border-2 border-red-200 focus:border-red-400 pr-10"
                      placeholder={t("profile.enterCurrentPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="border-2 border-red-200 focus:border-red-400 pr-10"
                      placeholder={t("profile.enterNewPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="border-2 border-red-200 focus:border-red-400 pr-10"
                      placeholder={t("profile.confirmNewPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isPasswordLoading}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {isPasswordLoading ? t("common.updating") : t("profile.changePassword")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}