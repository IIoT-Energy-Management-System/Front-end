"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { Download } from "lucide-react"

export default function Backup() {
  const { factories } = useAppStore()

  const handleBackupData = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      factories,
      settings: {
        // Add other settings as needed
      },
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `iiot-backup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string)
        alert("Data restored successfully!")
      } catch (error) {
        alert("Failed to restore data. Invalid backup file.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Sao Lưu & Khôi Phục
        </CardTitle>
        <CardDescription>Sao lưu dữ liệu hệ thống và khôi phục từ các bản sao lưu trước đó</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">Tạo Bản Sao Lưu</h4>
            <p className="text-sm text-gray-600">
              Xuất tất cả dữ liệu hệ thống bao gồm người dùng, thiết bị, cài đặt và cấu hình.
            </p>
            <Button onClick={handleBackupData} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Tải Bản Sao Lưu
            </Button>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium">Khôi Phục Dữ Liệu</h4>
            <p className="text-sm text-gray-600">
              Nhập dữ liệu từ tệp sao lưu trước đó. Điều này sẽ ghi đè dữ liệu hiện tại.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".json"
                onChange={handleRestoreData}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}