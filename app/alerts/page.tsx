"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { PermissionGuard } from "@/components/PermissionGuard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useAlertApi } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import { useAppStore } from "@/lib/store"
import type { Alert } from "@/lib/types"
import { AlertTriangle, Bell, CheckCircle, Clock, Eye, Filter, Search, Shield } from "lucide-react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from "react"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [isAcknowledgeDialogOpen, setIsAcknowledgeDialogOpen] = useState(false)
  const [isSolveDialogOpen, setIsSolveDialogOpen] = useState(false)
  const [acknowledgmentNote, setAcknowledgmentNote] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const { user } = useAppStore()
  const { t } = useTranslation()
  const itemsPerPage = 10

  const {getAlerts, confirmAcknowledgeAlert, confirmResolveAlert} = useAlertApi()
  const searchParams = useSearchParams()
  const router = useRouter()
  // Generate sample alerts
    const fetchAlerts = async () => {
      try {
        const response = await getAlerts();
        setAlerts(response.data);
        console.log(response.data);

        // If we have alertId in query params, open dialog for that alert
        const alertId = searchParams?.get?.('alertId')
        if (alertId) {
          const matched = response.data.find((a: Alert) => a.id === alertId)
          if (matched) {
            setSelectedAlert(matched)
            setIsAcknowledgeDialogOpen(true)
            // Remove query param to keep URL clean
            router.replace('/alerts')
          }
        }
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      }
    };
  useEffect(() => {
    fetchAlerts();
    // Simulate new alerts
    // const interval = setInterval(() => {
    //   if (Math.random() < 0.1) {
    //     // 10% chance every 30 seconds
    //     const randomDevice = devices[Math.floor(Math.random() * devices.length)]
    //     const alertTypes = ["Power Threshold", "Device Offline", "Low Power Factor", "Temperature"]
    //     const severities: Alert["severity"][] = ["Info", "Warning", "Critical"]

    //     const newAlert: Alert = {
    //       id: `alert-${Date.now()}`,
    //       deviceId: randomDevice?.id || "device-1",
    //       type: alertTypes[Math.floor(Math.random() * alertTypes.length)] as Alert["type"],
    //       severity: severities[Math.floor(Math.random() * severities.length)],
    //       message: `Automated alert for ${randomDevice?.name || "Unknown Device"}`,
    //       timestamp: new Date().toISOString(),
    //       acknowledged: false,
    //       resolved: false,
    //     }

    //     setAlerts((prev) => [newAlert, ...prev])
    //   }
    // }, 30000)

    // return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, severityFilter, statusFilter])
  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    const deviceName = alert?.deviceName || "Unknown Device"

    const matchesSearch =
      deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "unacknowledged" && !alert.acknowledged) ||
      (statusFilter === "acknowledged" && alert.acknowledged && !alert.resolved) ||
      (statusFilter === "resolved" && alert.resolved)

    return matchesSearch && matchesSeverity && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + itemsPerPage)

  const handleAcknowledgeAlert = (alert: Alert) => {
    setSelectedAlert(alert)
    setIsAcknowledgeDialogOpen(true)
  }

  const confirmAcknowledge = async () => {
    if (!selectedAlert || !user) return
    
    try {
        console.log("Acknowledging alert:", selectedAlert.id, "by user:", user.id ?? "", "with note:", acknowledgmentNote)
        await confirmAcknowledgeAlert(selectedAlert.id, { userId: user.id ?? "", acknowledgmentNote })
    } catch (error) {
        console.error("Failed to acknowledge alert:", error)
    }
    fetchAlerts()

    setIsAcknowledgeDialogOpen(false)
    setSelectedAlert(null)
    setAcknowledgmentNote("")
  }

  const handleResolveAlert = (alert: Alert) => {
    setSelectedAlert(alert)
    setIsSolveDialogOpen(true)
  }

    const confirmResolve = async () => {
    if (!selectedAlert || !user) return
    try {
        console.log("Resolving alert:", selectedAlert.id, "by user:", user.id ?? "")
        await confirmResolveAlert(selectedAlert.id)
    } catch (error) {
        console.error("Failed to resolve alert:", error)

    }
    fetchAlerts()
    setIsSolveDialogOpen(false)
    setSelectedAlert(null)
    }

    const handleOpen = (alert: Alert) => {
      setIsSolveDialogOpen(true)
      setSelectedAlert(alert)
    }

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "Critical":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0"
      case "Warning":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0"
      case "Info":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0"
    }
  }

  const getSeverityIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "Critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "Warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "Info":
        return <Bell className="h-4 w-4 text-blue-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length
  const criticalCount = alerts.filter((a) => a.severity === "Critical" && !a.resolved).length

  return (
    <MainLayout>
      <div className="space-y-6 bg-gradient-to-br from-gray-50 to-red-5050 p-6 -m-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Quản Lý Cảnh Báo
            </h1>
            <p className="text-gray-600 mt-2">Giám sát và quản lý cảnh báo và thông báo hệ thống</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 text-sm px-3 py-1">
              {criticalCount} Nghiêm Trọng
            </Badge>
            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 text-sm px-3 py-1">
              {unacknowledgedCount} Chưa Xác Nhận
            </Badge>
          </div>
        </div>

        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Tổng Cảnh Báo</CardTitle>
              <Bell className="h-6 w-6 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alerts.length}</div>
              <p className="text-xs text-white/80">24 giờ qua</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Cảnh Báo Nghiêm Trọng</CardTitle>
              <AlertTriangle className="h-6 w-6 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{criticalCount}</div>
              <p className="text-xs text-white/80">Cần xử lý ngay lập tức</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Chưa Xác Nhận</CardTitle>
              <Clock className="h-6 w-6 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{unacknowledgedCount}</div>
              <p className="text-xs text-white/80">Đang chờ xác nhận</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/90">Đã Giải Quyết Hôm Nay</CardTitle>
              <CheckCircle className="h-6 w-6 text-white/80" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{alerts.filter((a) => a.resolved).length}</div>
              <p className="text-xs text-white/80">Đã giải quyết thành công</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm cảnh báo, thiết bị hoặc tin nhắn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-red-200 focus:border-red-400"
                  />
                </div>
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-48 border-2 border-red-200 focus:border-red-400">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Mức Độ</SelectItem>
                  <SelectItem value="Critical">Nghiêm Trọng</SelectItem>
                  <SelectItem value="Warning">Cảnh Báo</SelectItem>
                  <SelectItem value="Info">Thông Tin</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-2 border-red-200 focus:border-red-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
                  <SelectItem value="unacknowledged">Chưa Xác Nhận</SelectItem>
                  <SelectItem value="acknowledged">Đã Xác Nhận</SelectItem>
                  <SelectItem value="resolved">Đã Giải Quyết</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Lịch Sử Cảnh Báo
            </CardTitle>
            <CardDescription>
              Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredAlerts.length)} trong{" "}
              {filteredAlerts.length} cảnh báo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-red-50 to-orange-50">
                  <TableHead className="font-semibold">Mức Độ</TableHead>
                  <TableHead className="font-semibold">Thiết Bị</TableHead>
                  <TableHead className="font-semibold">Loại</TableHead>
                  <TableHead className="font-semibold">Tin Nhắn</TableHead>
                  <TableHead className="font-semibold">Thời Gian</TableHead>
                  <TableHead className="font-semibold">Xác nhận bởi</TableHead>
                  <TableHead className="font-semibold">Trạng Thái</TableHead>
                  <TableHead className="font-semibold">Hành Động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAlerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={`hover:bg-red-50/50 transition-colors ${
                      alert.severity === "Critical" ? "bg-red-50/30" : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(alert.severity)}
                        <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{alert.deviceName}</TableCell>
                    <TableCell>{alert.type}</TableCell>
                    <TableCell className="max-w-xs truncate">{alert.message}</TableCell>
                    <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{alert.acknowledgedBy}</TableCell>
                    <TableCell>
                      {alert.resolved ? (
                        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                          Đã Giải Quyết
                        </Badge>
                      ) : alert.acknowledged ? (
                        <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                          Đã Xác Nhận
                        </Badge>
                      ) : (
                        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">Mới</Badge>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission="alert.acknowledge">
                            {!alert.acknowledged && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAcknowledgeAlert(alert)}
                                className="border-2 border-yellow-200 hover:bg-yellow-50"
                            >
                                Xác Nhận
                            </Button>
                            )}
                        </PermissionGuard>
                        <PermissionGuard permission="alert.resolve">
                            {alert.acknowledged && !alert.resolved && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveAlert(alert)}
                                className="border-2 border-green-200 hover:bg-green-50"
                            >
                                Giải Quyết
                            </Button>
                            )}
                        </PermissionGuard>
                        {alert.acknowledged && alert.resolved && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:bg-blue-100 cursor-pointer"
                                onClick={() => handleOpen(alert)}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredAlerts.length)} trong{" "}
              {filteredAlerts.length} cảnh báo
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-2 border-red-200 hover:bg-red-50"
              >
                Trước
              </Button>
              <span className="text-sm">
                Trang {currentPage} trong {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="border-2 border-red-200 hover:bg-red-50"
              >
                Tiếp
              </Button>
            </div>
          </div>
        )}

        {/* Acknowledge Dialog */}
        <Dialog open={isAcknowledgeDialogOpen} onOpenChange={setIsAcknowledgeDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>Xác Nhận Cảnh Báo</DialogTitle>
              <DialogDescription>
                Xác nhận cảnh báo này và tùy chọn thêm ghi chú về hành động đã thực hiện.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedAlert && (
                <div className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(selectedAlert.severity)}
                    <Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
                    <span className="font-medium">{selectedAlert.deviceName}</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedAlert.message}</p>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="acknowledgmentNote" className="text-sm font-medium">
                  Ghi Chú Xác Nhận (Tùy Chọn)
                </label>
                <Textarea
                  id="acknowledgmentNote"
                  placeholder="Thêm ghi chú về cảnh báo này hoặc hành động đã thực hiện..."
                  value={acknowledgmentNote}
                  onChange={(e) => setAcknowledgmentNote(e.target.value)}
                  className="border-2 border-red-200 focus:border-red-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAcknowledgeDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={confirmAcknowledge}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                Xác Nhận Cảnh Báo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog open={isSolveDialogOpen} onOpenChange={setIsSolveDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-sm">
            <DialogHeader>
              <DialogTitle>Xác Nhận Giải Quyết Cảnh Báo</DialogTitle>
              <DialogDescription>
                Xác nhận rằng bạn đã giải quyết cảnh báo này.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedAlert && (
                <div className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(selectedAlert.severity)}
                    <Badge className={getSeverityColor(selectedAlert.severity)}>{selectedAlert.severity}</Badge>
                    <span className="font-medium">{selectedAlert.deviceName}</span>
                  </div>
                  <p className="text-sm text-gray-600">{selectedAlert.message}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-red-700">
                  Đã xác nhận:
                </label>
                <div className="p-4 border rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Xác nhận bởi</span>
                      <span className="font-medium text-red-700">{selectedAlert?.acknowledgedBy || "Chưa rõ"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Thời gian</span>
                      <span className="text-sm text-gray-700">
                        {selectedAlert?.acknowledgedAt ? new Date(selectedAlert.acknowledgedAt).toLocaleString() : ""}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3 border border-red-100">
                    <span className="text-xs text-gray-500">Ghi chú xác nhận</span>
                    <p className="italic text-gray-700 mt-1">
                      {selectedAlert?.acknowledgmentNote ? `"${selectedAlert.acknowledgmentNote}"` : <span className="text-gray-400">Không có ghi chú</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSolveDialogOpen(false)}>
                Hủy
              </Button>
              {selectedAlert?.acknowledged && !selectedAlert?.resolved && (
              <Button
                onClick={confirmResolve}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Xác Nhận Cảnh Báo
              </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        
      </div>
    </MainLayout>
  )
}
