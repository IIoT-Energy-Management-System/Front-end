"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DbConfigApiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { useTranslation } from "@/lib/i18n"
import { Database } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from 'sonner'

export default function DatabaseSettings() {
  const { t } = useTranslation()
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

      if (response.success === true) {
        toast.success(t("database.connectionSuccess"))
      } else {
        toast.error(response.error || t("database.connectionFailed"))
      }
    } catch (error) {
      console.error('Database test error:', error)
      toast.error(t("database.testError"), {description: (error as any).error,})
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

      if (response.success === true) {
        toast.success(t("database.saveSuccess"))
      } else {
        toast.error(response.error || t("database.saveFailed"))
      }
    } catch (error) {
      console.error('Save config error:', error)
      toast.error(t("database.saveError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t("database.title")}
        </CardTitle>
        <CardDescription>{t("database.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="databaseMode">{t("database.mode")}</Label>
          <Select
            value={databaseSettings.mode}
            onValueChange={handleModeChange}
            disabled={!authService.hasPermission("settings.edit")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simulation">{t("database.simulation")}</SelectItem>
              <SelectItem value="mysql">{t("database.mysql")}</SelectItem>
              <SelectItem value="mssql">{t("database.mssql")}</SelectItem>
              <SelectItem value="postgresql">{t("database.postgresql")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {databaseSettings.mode !== "simulation" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dbHost">{t("database.host")}</Label>
              <Input
                id="dbHost"
                value={databaseSettings.host}
                onChange={(e) => setDatabaseSettings({ ...databaseSettings, host: e.target.value })}
                placeholder="localhost"
                disabled={!authService.hasPermission("settings.edit")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbPort">{t("database.port")}</Label>
              <Input
                id="dbPort"
                type="number"
                value={databaseSettings.port}
                onChange={(e) =>
                  setDatabaseSettings({ ...databaseSettings, port: Number.parseInt(e.target.value) || 3306 })
                }
                disabled={!authService.hasPermission("settings.edit")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbName">{t("database.name")}</Label>
              <Input
                id="dbName"
                value={databaseSettings.database}
                onChange={(e) => setDatabaseSettings({ ...databaseSettings, database: e.target.value })}
                disabled={!authService.hasPermission("settings.edit")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbUsername">{t("database.username")}</Label>
              <Input
                id="dbUsername"
                value={databaseSettings.username}
                onChange={(e) => setDatabaseSettings({ ...databaseSettings, username: e.target.value })}
                disabled={!authService.hasPermission("settings.edit")}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dbPassword">{t("database.password")}</Label>
              <Input
                id="dbPassword"
                type="password"
                value={databaseSettings.password}
                onChange={(e) => setDatabaseSettings({ ...databaseSettings, password: e.target.value })}
                disabled={!authService.hasPermission("settings.edit")}
              />
            </div>
          </div>
        )}

        <div className="flex gap-4 justify-center sm:justify-start">
          <Button 
            onClick={handleTestDatabaseConnection} 
            disabled={isTesting || databaseSettings.mode === "simulation" || !authService.hasPermission("settings.edit")}
          >
            {isTesting ? t("database.testing") : t("database.testConnection")}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSaveDatabaseConfig}
            disabled={isLoading || !authService.hasPermission("settings.edit")}
          >
            {isLoading ? t("database.saving") : t("database.saveConfig")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}