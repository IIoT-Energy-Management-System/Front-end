"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

export default function Logs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Nhật Ký Hệ Thống
        </CardTitle>
        <CardDescription>Xem nhật ký kiểm toán và hoạt động hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nhật Ký Kiểm Toán</CardTitle>
                <CardDescription>Hành động người dùng và sự kiện hệ thống</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 border-b">
                    <span>1. admin - 2024-01-15 10:30:00 - LOGIN</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>2. admin - 2024-01-15 10:32:15 - CREATE_DEVICE</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>3. admin - 2024-01-15 10:35:22 - UPDATE_SETTINGS</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>4. supervisor1 - 2024-01-15 10:40:10 - MOVE_DEVICE</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>5. operator1 - 2024-01-15 10:45:33 - VIEW_DASHBOARD</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nhật Ký Kết Nối</CardTitle>
                <CardDescription>Trạng thái kết nối thiết bị và lịch sử</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 border-b">
                    <span>1. Device-001 - Connected - 127.0.0.1 - 10:30:00</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>2. Device-002 - Disconnected - 192.168.1.100 - 10:28:15</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>3. Device-003 - Connected - 192.168.1.101 - 10:25:30</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>4. Device-050 - Error - 192.168.1.150 - 10:20:45</span>
                  </div>
                  <div className="flex justify-between p-2 border-b">
                    <span>5. Device-025 - Connected - 192.168.1.125 - 10:15:12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}