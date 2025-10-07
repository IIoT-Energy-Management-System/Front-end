"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SmtpConfigApiService } from "@/lib/api"
import { Mail } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from 'sonner';

export default function NotificationSettings() {
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
        secure: response.secure || true,
      })
    } catch (error) {
      console.error('Failed to load SMTP config:', error)
      toast.error("Không thể tải cấu hình SMTP")
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
      console.log('Test SMTP connection result:', response)

      if (response.success === true) {
        toast.success("Kết nối SMTP thành công!")
        console.log('SMTP connection test succeeded')
      } else {
        toast.error(response.error || "Không thể kết nối đến SMTP")
      }
    } catch (error) {
      console.error('SMTP test error:', error)
      toast.error("Có lỗi xảy ra khi kiểm tra kết nối")
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

      if (response.ok) {
        toast.success("Cấu hình SMTP đã được lưu!")
      } else {
        toast.error(response.error || "Không thể lưu cấu hình SMTP")
      }
    } catch (error) {
      console.error('Save config error:', error)
      toast.error("Có lỗi xảy ra khi lưu cấu hình")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Cài Đặt Thông Báo Email
        </CardTitle>
        <CardDescription>Cấu hình máy chủ SMTP cho cảnh báo và báo cáo qua email</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="smtpHost">Máy Chủ SMTP</Label>
            <Input
              id="smtpHost"
              value={smtpSettings.host}
              onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPort">Cổng</Label>
            <Input
              id="smtpPort"
              type="number"
              value={smtpSettings.port}
              onChange={(e) =>
                setSmtpSettings({ ...smtpSettings, port: Number.parseInt(e.target.value) || 587 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpUsername">Tên Đăng Nhập</Label>
            <Input
              id="smtpUsername"
              value={smtpSettings.username}
              onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPassword">Mật Khẩu</Label>
            <Input
              id="smtpPassword"
              type="password"
              value={smtpSettings.password}
              onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="smtpSecure"
            checked={smtpSettings.secure}
            onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, secure: checked })}
          />
          <Label htmlFor="smtpSecure">Sử Dụng SSL/TLS</Label>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={handleTestSmtpConnection} 
            disabled={isTesting}
          >
            {isTesting ? "Đang kiểm tra..." : "Kiểm Tra Kết Nối"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveSmtpConfig}
            disabled={isLoading}
          >
            {isLoading ? "Đang lưu..." : "Lưu Cấu Hình"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}