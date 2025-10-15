"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BackupApiService } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import { Download, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { authService } from "@/lib/auth"

export default function Backup() {
  const { t } = useTranslation()
    const [loading, setLoading] = useState(false)

  const handleBackupData = async () => {
        try {
            setLoading(true)
            const response = await BackupApiService.createBackup()
            const blob = new Blob([response], { type: "application/octet-stream" })
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_${new Date().toISOString()}.bak`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to create backup:", error);
            toast.error("Failed to create backup")
        } finally {
            setLoading(false);
        }
    }

  const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.bak')) {
      toast.error("Please select a valid .bak backup file")
      return
    }

    try {
      setLoading(true)
      const result = await BackupApiService.restoreBackup(file)

      if (result.success) {
        toast.success("Database restored successfully!")
      } else {
        toast.error(result.error || "Failed to restore database")
      }
    } catch (error) {
      console.error("Failed to restore database:", error)
      toast.error("Failed to restore database")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          {t("backup.title")}
        </CardTitle>
        <CardDescription>{t("backup.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">{t("backup.createBackup")}</h4>
            <p className="text-sm text-gray-600">
              {t("backup.createDescription")}
            </p>
            {loading ? (
                <Button disabled className="w-full flex items-center justify-center">
                    <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                    {t("backup.downloadBackup")}
                </Button>
            ) : (
              <Button disabled={!authService.hasPermission("settings.edit")} onClick={handleBackupData} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                {t("backup.downloadBackup")}
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">{t("backup.restoreData")}</h4>
            <p className="text-sm text-gray-600">
              {t("backup.restoreDescription")}
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".bak"
                onChange={handleRestoreData}
                disabled={!authService.hasPermission("settings.edit")}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 h-full"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}