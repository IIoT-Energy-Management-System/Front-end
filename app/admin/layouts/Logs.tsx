"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAuditLogs, getConnectionLogs } from "@/lib/api"
import type { AuditLogEntry, ConnectionLogEntry } from "@/lib/types"
import { Activity, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function Logs() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [connectionLogs, setConnectionLogs] = useState<ConnectionLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [auditData, connectionData] = await Promise.all([
          getAuditLogs(),
          getConnectionLogs()
        ])
        
        setAuditLogs(auditData)
        setConnectionLogs(connectionData)
      } catch (err) {
        console.error('Error fetching logs:', err)
        setError('Không thể tải nhật ký hệ thống')
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Nhật Ký Hệ Thống
          </CardTitle>
          <CardDescription>Đang tải nhật ký hệ thống...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Nhật Ký Hệ Thống
          </CardTitle>
          <CardDescription>Có lỗi xảy ra khi tải nhật ký</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

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
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Chưa có nhật ký kiểm toán nào
                    </div>
                  ) : (
                    auditLogs.map((log, index) => (
                      <div key={log.id} className="flex justify-between p-2 border-b">
                        <span>{index + 1}. {log.username} - {formatTimestamp(log.timestamp)} - {log.action}</span>
                      </div>
                    ))
                  )}
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
                  {connectionLogs.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Chưa có nhật ký kết nối nào
                    </div>
                  ) : (
                    connectionLogs.map((log, index) => (
                      <div key={log.id} className="flex justify-between p-2 border-b">
                        <span>{index + 1}. {log.deviceName} - {log.connectionType} ({log.status}) - {log.ipAddress || 'N/A'} - {formatTimestamp(log.timestamp).split(' ')[1]}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}