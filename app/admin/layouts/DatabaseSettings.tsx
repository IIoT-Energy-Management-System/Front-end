"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database } from "lucide-react"
import { useState } from "react"

export default function DatabaseSettings() {
  const [databaseSettings, setDatabaseSettings] = useState({
    mode: "simulation" as "simulation" | "mysql" | "mssql" | "postgresql",
    host: "",
    port: 3306,
    database: "",
    username: "",
    password: "",
  })

  const handleTestDatabaseConnection = async () => {
    alert("Database connection test successful!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cấu Hình Cơ Sở Dữ Liệu
        </CardTitle>
        <CardDescription>Cấu hình kết nối cơ sở dữ liệu và cài đặt nguồn dữ liệu</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="databaseMode">Chế Độ Cơ Sở Dữ Liệu</Label>
          <Select
            value={databaseSettings.mode}
            onValueChange={(value: typeof databaseSettings.mode) =>
              setDatabaseSettings({ ...databaseSettings, mode: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simulation">Chế Độ Mô Phỏng</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="mssql">Microsoft SQL Server</SelectItem>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {databaseSettings.mode !== "simulation" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dbHost">Máy Chủ</Label>
              <Input
                id="dbHost"
                value={databaseSettings.host}
                onChange={(e) => setDatabaseSettings({ ...databaseSettings, host: e.target.value })}
                placeholder="localhost"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbPort">Cổng</Label>
              <Input
                id="dbPort"
                type="number"
                value={databaseSettings.port}
                onChange={(e) =>
                  setDatabaseSettings({ ...databaseSettings, port: Number.parseInt(e.target.value) || 3306 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbName">Tên Cơ Sở Dữ Liệu</Label>
              <Input
                id="dbName"
                value={databaseSettings.database}
                onChange={(e) => setDatabaseSettings({ ...databaseSettings, database: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbUsername">Tên Đăng Nhập</Label>
              <Input
                id="dbUsername"
                value={databaseSettings.username}
                onChange={(e) => setDatabaseSettings({ ...databaseSettings, username: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="dbPassword">Mật Khẩu</Label>
              <Input
                id="dbPassword"
                type="password"
                value={databaseSettings.password}
                onChange={(e) => setDatabaseSettings({ ...databaseSettings, password: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={handleTestDatabaseConnection}>Kiểm Tra Kết Nối</Button>
          <Button variant="outline">Lưu Cấu Hình</Button>
        </div>
      </CardContent>
    </Card>
  )
}