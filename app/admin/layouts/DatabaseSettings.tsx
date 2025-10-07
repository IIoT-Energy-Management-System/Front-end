"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from 'sonner';
import { Database } from "lucide-react"
import { useEffect, useState } from "react"
import { DbConfigApiService } from "@/lib/api"

export default function DatabaseSettings() {
  const [databaseSettings, setDatabaseSettings] = useState({
    mode: "simulation" as "simulation" | "mysql" | "mssql" | "postgresql",
    host: "",
    port: 3306,
    database: "",
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  // Load current config on component mount
  useEffect(() => {
    loadDatabaseConfig()
  }, [])

  const loadDatabaseConfig = async () => {
    try {
      const response = await DbConfigApiService.getDbConfig()
      console.log('Loaded DB config:', response)
      setDatabaseSettings({
        mode: response.mode || "simulation",
        host: response.host || "",
        port: response.port || 3306,
        database: response.database || "",
        username: response.username || "",
        password: "", // Don't load password for security
          })
    } catch (error) {
      console.error('Failed to load database config:', error)
      toast.error("Không thể tải cấu hình cơ sở dữ liệu")
    }
  }

  const handleModeChange = (value: typeof databaseSettings.mode) => {
    const defaultPorts = {
      simulation: 0,
      mysql: 3306,
      mssql: 1433,
      postgresql: 5432,
    }
    
    setDatabaseSettings({ 
      ...databaseSettings, 
      mode: value,
      port: defaultPorts[value]
    })
  }

  const handleTestDatabaseConnection = async () => {
    setIsTesting(true)
    try {
      const testData = {
        mode: databaseSettings.mode,
        host: databaseSettings.host,
        port: databaseSettings.port,
        database: databaseSettings.database,
        username: databaseSettings.username,
        password: databaseSettings.password,
      }

      const response = await DbConfigApiService.testDbConnection(testData)
      console.log('Test DB connection result:', response)

      if (response.success === true) {
        toast.success("Kết nối cơ sở dữ liệu thành công!")
        console.log('Database connection test succeeded')
      } else {
        toast.error(response.error || "Không thể kết nối đến cơ sở dữ liệu")
      }
    } catch (error) {
      console.error('Database test error:', error)
      toast.error("Có lỗi xảy ra khi kiểm tra kết nối", {description: (error as any).error,})
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveDatabaseConfig = async () => {
    setIsLoading(true)
    try {
      const configData = {
        mode: databaseSettings.mode,
        host: databaseSettings.host,
        port: databaseSettings.port,
        database: databaseSettings.database,
        username: databaseSettings.username,
        password: databaseSettings.password,
      }

      const response = await DbConfigApiService.updateDbConfig(configData)

      if (response.ok) {
        toast.success("Cấu hình cơ sở dữ liệu đã được lưu!")
      } else {
        toast.error(response.error || "Không thể lưu cấu hình cơ sở dữ liệu")
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
            onValueChange={handleModeChange}
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
          <Button 
            onClick={handleTestDatabaseConnection} 
            disabled={isTesting || databaseSettings.mode === "simulation"}
          >
            {isTesting ? "Đang kiểm tra..." : "Kiểm Tra Kết Nối"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveDatabaseConfig}
            disabled={isLoading}
          >
            {isLoading ? "Đang lưu..." : "Lưu Cấu Hình"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}