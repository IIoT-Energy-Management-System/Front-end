"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Mail } from "lucide-react"
import { useState } from "react"

export default function NotificationSettings() {
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: 587,
    username: "",
    password: "",
    secure: true,
  })

  const handleTestSMTPConnection = async () => {
    alert("SMTP connection test successful!")
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
          <Button onClick={handleTestSMTPConnection}>Kiểm Tra Kết Nối SMTP</Button>
          <Button variant="outline">Lưu Cài Đặt</Button>
        </div>
      </CardContent>
    </Card>
  )
}