"use client"

import { CustomPagination } from "@/components/custom-pagination"
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
    DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BuildingApiService, DeviceApiService, FactoryApiService, ReportApiService } from "@/lib/api"
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
        setDevices(devicesRes.data)
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
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 text-center sm:text-left">{t("reports.title")}</h1>
            <p className="text-gray-600">{t("reports.description")}</p>
          </div>
                <PermissionGuard permission="report.generate">
                    <Button onClick={handleOpenCreateDialog} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("reports.createReport")}
                    </Button>
                </PermissionGuard>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("reports.generateReport")}</DialogTitle>
                <DialogDescription>{t("reports.generateReportDescription")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportName">{t("reports.reportName")}</Label>
                    <Input
                      id="reportName"
                      value={newReport.name}
                      onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                      placeholder={t("reports.reportNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportType">{t("reports.reportType")}</Label>
                    <Select
                      value={newReport.type}
                      onValueChange={(value: Report["type"]) => setNewReport({ ...newReport, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">{t("analytics.daily")}</SelectItem>
                        <SelectItem value="Weekly">{t("analytics.weekly")}</SelectItem>
                        <SelectItem value="Monthly">{t("analytics.monthly")}</SelectItem>
                        <SelectItem value="Custom">{t("analytics.custom")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t("reports.startDate")}</Label>
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
                    <Label htmlFor="endDate">{t("reports.endDate")}</Label>
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
                  <Label>{t("filters.selectFactory")}</Label>
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
                    <Label>{t("filters.selectBuilding")} ({t("filters.optional")})</Label>
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

                <div className="text-sm text-gray-600">{t("filters.range")}: {getFilteredDevices().length} {t("layouts.devices")}</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button onClick={handleCreateReport} disabled={!newReport.name || newReport.factoryIds.length === 0}>
                  {t("reports.generateReport")}
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
                    placeholder={t("reports.searchPlaceholder")}
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
              {t("reports.createdReports")}
            </CardTitle>
            <CardDescription>
              {loading ? t("common.loading") : `${t("common.showing")} ${startIndex + 1} ${t("common.to")} ${Math.min(startIndex + itemsPerPage, filteredReports.length)} ${t("common.of")} ${filteredReports.length} ${t("analytics.report")}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">{t("common.loading")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("reports.reportName")}</TableHead>
                    <TableHead>{t("reports.type")}</TableHead>
                    <TableHead>{t("reports.dateRange")}</TableHead>
                    <TableHead>{t("reports.createdAt")}</TableHead>
                    <TableHead>{t("reports.createdBy")}</TableHead>
                    <TableHead>{t("reports.devices")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
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
                      <TableCell>{typeof report.data?.devices === 'object' ? report.data?.devices?.total || 0 : report.data?.devices || 0}</TableCell>
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
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredReports.length}
          showInfo={true}
          t={t}
          itemName={t("analytics.report")}
        />
      </div>
    </MainLayout>
  )
}
