"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SmtpConfigApiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { useTranslation } from "@/lib/i18n"
import { Mail } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from 'sonner'

export default function NotificationSettings() {
  const { t } = useTranslation()
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    secure: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Load current config on component mount
  useEffect(() => {
    loadSmtpConfig()
  }, [])

  const loadSmtpConfig = async () => {
    try {
      const response = await SmtpConfigApiService.getSmtpConfig()
      setSmtpSettings({
        host: response.host || "",
        port: response.port || 587,
        username: response.username || "",
        password: "", // Don't load password for security
        secure: response.secure,
      })
    } catch (error) {
      console.error('Failed to load SMTP config:', error)
      toast.error(t("notification.loadError"))
    }
  }

  const handleTestSmtpConnection = async () => {
    setIsTesting(true)
    try {
      const testData = {
        host: smtpSettings.host,
        port: smtpSettings.port,
        username: smtpSettings.username,
        password: smtpSettings.password,
        secure: smtpSettings.secure,
      }

      const response = await SmtpConfigApiService.testSmtpConnection(testData)

      if (response.success === true) {
        toast.success(t("notification.connectionSuccess"))
      } else {
        toast.error(response.error || t("notification.connectionFailed"))
      }
    } catch (error) {
      console.error('SMTP test error:', error)
      toast.error(t("notification.testError"))
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveSmtpConfig = async () => {
    setIsLoading(true)
    try {
      const configData = {
        host: smtpSettings.host,
        port: smtpSettings.port,
        username: smtpSettings.username,
        password: smtpSettings.password,
        secure: smtpSettings.secure,
      }

      const response = await SmtpConfigApiService.updateSmtpConfig(configData)

      if (response.success === true) {
        toast.success(t("notification.saveSuccess"))
      } else {
        toast.error(response.error || t("notification.saveFailed"))
      }
    } catch (error) {
      console.error('Save config error:', error)
      toast.error(t("notification.saveError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t("notification.title")}
        </CardTitle>
        <CardDescription>{t("notification.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtpHost">{t("notification.smtpHost")}</Label>
            <Input
              id="smtpHost"
              value={smtpSettings.host}
              onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
              placeholder="smtp.gmail.com"
              disabled={!authService.hasPermission("settings.edit")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPort">{t("notification.port")}</Label>
            <Input
              id="smtpPort"
              type="number"
              value={smtpSettings.port}
              onChange={(e) =>
                setSmtpSettings({ ...smtpSettings, port: Number.parseInt(e.target.value) || 587 })
              }
              disabled={!authService.hasPermission("settings.edit")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpUsername">{t("notification.username")}</Label>
            <Input
              id="smtpUsername"
              value={smtpSettings.username}
              onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
              disabled={!authService.hasPermission("settings.edit")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPassword">{t("notification.password")}</Label>
            <Input
              id="smtpPassword"
              type="password"
              value={smtpSettings.password}
              onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
              disabled={!authService.hasPermission("settings.edit")}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="smtpSecure"
            checked={smtpSettings.secure}
            onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, secure: checked })}
            disabled={!authService.hasPermission("settings.edit")}
          />
          <Label htmlFor="smtpSecure">{t("notification.useSSL")}</Label>
        </div>
        <div className="flex gap-4 justify-center sm:justify-start">
          <Button 
            onClick={handleTestSmtpConnection} 
            disabled={isTesting || !authService.hasPermission("settings.edit")}
          >
            {isTesting ? t("notification.testing") : t("notification.testConnection")}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveSmtpConfig}
            disabled={isLoading || !authService.hasPermission("settings.edit")}
          >
            {isLoading ? t("notification.saving") : t("notification.saveConfig")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}