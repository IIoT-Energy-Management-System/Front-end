"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { PermissionGuard } from "@/components/PermissionGuard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FactoryApiService, BuildingApiService, DeviceApiService, ReportApiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { useTranslation } from "@/lib/i18n"
import type { Building, Device, Factory, Report } from "@/lib/types"
import { Download, FileText, Plus, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function ReportsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [factories, setFactories] = useState<Factory[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [devices, setDevices] = useState<Device[]>([])

  const [newReport, setNewReport] = useState({
    name: "",
    type: "Daily" as Report["type"],
    factoryIds: [] as string[],
    buildingIds: [] as string[],
    floorIds: [] as string[],
    lineIds: [] as string[],
    deviceIds: [] as string[],
    dateRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

//   const { factories, devices, language } = useAppStore()
  const { t } = useTranslation()
  const itemsPerPage = 10

  // Fetch reports, factories, and devices on mount
  const fetchReports = async () => {
    try {
        setLoading(true)
        const reportsRes = await ReportApiService.getReports()
        setReports(reportsRes)
    } catch (err) {
        toast.error('Network error while fetching reports')
        console.error('Error fetching reports:', err)
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [factoriesRes, buildingsRes, devicesRes] = await Promise.all([
            FactoryApiService.getFactories(),
            BuildingApiService.getBuildings(),
            DeviceApiService.getDevices(),
        ])
        setFactories(factoriesRes)
        setBuildings(buildingsRes)
        setDevices(devicesRes)
      } catch (err) {
        toast.error('Network error while fetching data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
    fetchData()
  }, [])

  const handleCreateReport = async () => {
    const user = authService.getCurrentUser()
    try {
      const reportPayload = {
        name: newReport.name,
        type: newReport.type,
        factoryIds: newReport.factoryIds,
        buildingIds: newReport.buildingIds,
        floorIds: newReport.floorIds,
        lineIds: newReport.lineIds,
        deviceIds: newReport.deviceIds,
        dateRange: {
          start: new Date(newReport.dateRange.start).toISOString(),
          end: new Date(newReport.dateRange.end).toISOString(),
        },
        generatedBy: user?.id ?? ""
      }

      await ReportApiService.createReport(reportPayload)
      fetchReports()
      setIsCreateDialogOpen(false)
      resetNewReport()
      toast.success('Report created successfully')
    } catch (err) {
      toast.error('Network error while creating report')
      console.error('Error creating report:', err)
    }
  }

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true)
  }

  const resetNewReport = () => {
    setNewReport({
      name: "",
      type: "Daily",
      factoryIds: [],
      buildingIds: [],
      floorIds: [],
      lineIds: [],
      deviceIds: [],
      dateRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
      },
    })
  }

  const getFilteredDevices = () => {
    let filtered = devices
    if (newReport.factoryIds.length > 0) {
      filtered = filtered.filter((d) => newReport.factoryIds.includes(d.factoryId))
    }
    if (newReport.buildingIds.length > 0) {
      filtered = filtered.filter((d) => newReport.buildingIds.includes(d.buildingId))
    }
    if (newReport.floorIds.length > 0) {
      filtered = filtered.filter((d) => newReport.floorIds.includes(d.floorId))
    }
    if (newReport.lineIds.length > 0) {
      filtered = filtered.filter((d) => newReport.lineIds.includes(d.lineId))
    }
    return filtered
  }

  const downloadReport = async (report: Report, format: "pdf" | "excel") => {
    try {
      const response = await ReportApiService.exportReport(report?.id ?? "", format)
      const blob = new Blob([response], { type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${report.name.replace(/\s+/g, "_")}.${format === "pdf" ? "pdf" : "xlsx"}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded successfully')
    } catch (err) {
      toast.error('Network error while downloading report')
      console.error('Error downloading report:', err)
    }
  }

  const getReportTypeColor = (type: Report["type"]) => {
    switch (type) {
      case "Daily":
        return "default"
      case "Weekly":
        return "secondary"
      case "Monthly":
        return "outline"
      case "Custom":
        return "destructive"
      default:
        return "default"
    }
  }

  const filteredReports = reports.filter((report) => report.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Báo Cáo</h1>
            <p className="text-gray-600">Tạo và quản lý báo cáo tiêu thụ năng lượng</p>
          </div>
                <PermissionGuard permission="report.generate">
                    <Button onClick={handleOpenCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo Báo Cáo
                    </Button>
                </PermissionGuard>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Tạo Báo Cáo Mới</DialogTitle>
                <DialogDescription>Cấu hình thông số và phạm vi báo cáo</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportName">Tên Báo Cáo</Label>
                    <Input
                      id="reportName"
                      value={newReport.name}
                      onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                      placeholder="Nhập tên báo cáo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportType">Loại Báo Cáo</Label>
                    <Select
                      value={newReport.type}
                      onValueChange={(value: Report["type"]) => setNewReport({ ...newReport, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Hàng Ngày</SelectItem>
                        <SelectItem value="Weekly">Hàng Tuần</SelectItem>
                        <SelectItem value="Monthly">Hàng Tháng</SelectItem>
                        <SelectItem value="Custom">Tùy Chỉnh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Ngày Bắt Đầu</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newReport.dateRange.start}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          dateRange: { ...newReport.dateRange, start: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Ngày Kết Thúc</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newReport.dateRange.end}
                      onChange={(e) =>
                        setNewReport({
                          ...newReport,
                          dateRange: { ...newReport.dateRange, end: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                {/* Factory Selection */}
                <div className="space-y-2">
                  <Label>Chọn Nhà Máy</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {factories.map((factory) => (
                      <div key={factory.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`factory-${factory.id}`}
                          checked={newReport.factoryIds.includes(factory.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewReport((prev) => ({
                                ...prev,
                                factoryIds: [...prev.factoryIds, factory.id],
                              }))
                            } else {
                              setNewReport((prev) => ({
                                ...prev,
                                factoryIds: prev.factoryIds.filter((id) => id !== factory.id),
                                buildingIds: prev.buildingIds.filter((id) => {
                                    const building = buildings.find((b) => b.id === id)
                                    return building?.factoryId !== factory.id
                                }),
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={`factory-${factory.id}`} className="text-sm">
                          {factory.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Building Selection */}
                {newReport.factoryIds.length > 0 && (
                  <div className="space-y-2">
                    <Label>Chọn Tòa Nhà (Tùy Chọn)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {buildings
                        .filter((building) => newReport.factoryIds.includes(building.factoryId))
                        .map((building) => (
                          <div key={building.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`building-${building.id}`}
                              checked={newReport.buildingIds.includes(building.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewReport((prev) => ({
                                    ...prev,
                                    buildingIds: [...prev.buildingIds, building.id],
                                  }))
                                } else {
                                  setNewReport((prev) => ({
                                    ...prev,
                                    buildingIds: prev.buildingIds.filter((id) => id !== building.id),
                                  }))
                                }
                              }}
                            />
                            <Label htmlFor={`building-${building.id}`} className="text-sm">
                              {building.name}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600">Phạm vi đã chọn: {getFilteredDevices().length} thiết bị</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateReport} disabled={!newReport.name || newReport.factoryIds.length === 0}>
                  Tạo Báo Cáo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Tìm kiếm báo cáo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Báo Cáo Đã Tạo
            </CardTitle>
            <CardDescription>
              {loading ? 'Đang tải...' : `Hiển thị ${startIndex + 1} đến ${Math.min(startIndex + itemsPerPage, filteredReports.length)} trong ${filteredReports.length} báo cáo`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">Đang tải báo cáo...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên Báo Cáo</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Khoảng Thời Gian</TableHead>
                    <TableHead>Ngày Tạo</TableHead>
                    <TableHead>Được Tạo Bởi</TableHead>
                    <TableHead>Thiết Bị</TableHead>
                    <TableHead>Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant={getReportTypeColor(report.type)}>{report.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {report.dateRange?.start ? new Date(report.dateRange.start).toLocaleDateString() : 'N/A'} -{' '}
                        {report.dateRange?.end ? new Date(report.dateRange.end).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{report?.generatedAt ? new Date(report?.generatedAt).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell>{report?.generatedBy || 'N/A'}</TableCell>
                      <TableCell>{report.data?.devices || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => downloadReport(report, "pdf")}>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => downloadReport(report, "excel")}>
                            <Download className="h-4 w-4 mr-1" />
                            Excel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredReports.length)} trong{" "}
              {filteredReports.length} báo cáo
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
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
              >
                Tiếp
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
