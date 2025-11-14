"use client"

import { CustomPagination } from "@/components/custom-pagination"
import DeviceModal from "@/components/DeviceModal"
import { MainLayout } from "@/components/layout/main-layout"
import { PermissionGuard } from "@/components/PermissionGuard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDeviceApi, useFactoryApi } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import { useAppStore } from "@/lib/store"
import type { Device } from "@/lib/types"
import { Clock, Edit, Eye, Filter, Gauge, Plus, Search, Trash2, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"

export default function DevicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add")
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [apiFactories, setApiFactories] = useState<any[]>([])

  const { factories, language } = useAppStore()
  const { getDevices, createDevice, updateDevice, deleteDevice, updateDeviceStatus, getDeviceById } = useDeviceApi()
  const { getFactories } = useFactoryApi()
  const { t } = useTranslation()
  const itemsPerPage = 10

  // Load devices from API
  useEffect(() => {
    loadDevicesFromApi()
  }, [])

  // WebSocket connection for real-time device status updates
  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')

    socket.on('connect', () => {
      console.log('✅ WebSocket connected for device status updates')
    })

    socket.on('device-status-update', (data: { deviceId: string; status: Device['status']; timestamp: string }) => {
    //   console.log('📡 Received device status update:', data)
      
      // Update local devices state
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.id === data.deviceId 
            ? { ...device, status: data.status, lastSeen: data.timestamp }
            : device
        )
      )

    //   // Show toast notification
    //   toast.info(`Device status updated: ${data.status}`, {
    //     description: `Device ${data.deviceId} is now ${data.status}`
    //   })
    })

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected')
    })

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const loadDevicesFromApi = async () => {
    setLoading(true)
    try {
      // Load both devices and factories from API
      const [devicesData, factoriesData] = await Promise.all([
        getDevices(),
        getFactories()
      ])
      
      // Handle devices response format
      let deviceArray: Device[] = []
      if (Array.isArray(devicesData)) {
        deviceArray = devicesData
      } else if (devicesData && typeof devicesData === 'object') {
        // If response is an object, try to extract devices array from common properties
        const deviceObj = devicesData as any
        if ('data' in deviceObj && Array.isArray(deviceObj.data)) {
          deviceArray = deviceObj.data
        } else {
          // If object doesn't contain array, convert to single item array
          deviceArray = [devicesData as Device]
        }
      }
      
      setDevices(deviceArray)
      setApiFactories(factoriesData)
      
      // Debug logging để kiểm tra dữ liệu từ API
    //   console.log("Devices loaded from API:", deviceArray)
    //   console.log("Sample device with latestData:", deviceArray[0])
      
    //   // Hiển thị toast thành công khi load data
    //   if (deviceArray.length > 0) {
    //     toast.success(`Đã tải ${deviceArray.length} thiết bị thành công!`)
    //   }
    } catch (error) {
      console.error('Error loading data:', error)
      
      // Hiển thị toast lỗi khi load data thất bại
      toast.error("Không thể tải dữ liệu thiết bị. Vui lòng thử lại.")
      
      // Fallback to empty arrays
      setDevices([])
      setApiFactories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])
  // Filter devices - ensure devices is always an array
  const filteredDevices = (Array.isArray(devices) ? devices : []).filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination - ensure safe array operations
  const safeFilteredDevices = Array.isArray(filteredDevices) ? filteredDevices : []
  const totalPages = Math.ceil(safeFilteredDevices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDevices = safeFilteredDevices.slice(startIndex, startIndex + itemsPerPage)

  const handleAddDevice = async () => {
    setModalMode("add")
    setSelectedDevice(null)
    setIsModalOpen(true)
  }

  const handleEditDevice = async (device: Device) => {
    setModalMode("edit")
    setModalLoading(true)
    
    try {
      // Lấy chi tiết device từ API để có đầy đủ thông tin including latestData và connections
      const fullDeviceData = await getDeviceById(device.id)
      
    //   console.log("Full device data for edit:", fullDeviceData)
      setSelectedDevice(fullDeviceData)
    } catch (error) {
      console.error("Failed to fetch device details for edit:", error)
      // Fallback to basic device data if API call fails
      setSelectedDevice(device)
      
      toast.error("Không thể tải đầy đủ thông tin thiết bị. Hiển thị thông tin cơ bản.")
    } finally {
      setModalLoading(false)
    }
    
    setIsModalOpen(true)
  }

  const handleViewDevice = async (device: Device) => {
    setModalMode("view")
    setModalLoading(true)
    
    try {
      // Lấy chi tiết device từ API để có đầy đủ thông tin including latestData
      const fullDeviceData = await getDeviceById(device.id)
      
    //   console.log("Full device data from API:", fullDeviceData)
      setSelectedDevice(fullDeviceData)
    } catch (error) {
      console.error("Failed to fetch device details:", error)
      // Fallback to basic device data if API call failsf
      setSelectedDevice(device)
      
      toast.error("Không thể tải đầy đủ thông tin thiết bị. Hiển thị thông tin cơ bản.")
    } finally {
      setModalLoading(false)
    }
    
    setIsModalOpen(true)
  }

  const handleModalSave = async (deviceData: any) => {
    try {
      if (modalMode === "add") {
        await createDevice({
          ...deviceData,
        })
      } else if (modalMode === "edit" && selectedDevice) {
        await updateDevice(selectedDevice.id, deviceData)
      }
      
      await loadDevicesFromApi() // Reload devices after saving
    } catch (error) {
      console.error("Failed to save device:", error)
      throw error // Re-throw to let modal handle it
    }
  }

  const handleDeleteDevice = async (deviceId: string) => {
    if (confirm(`${t("devices.deleteConfirm")}`)) {
      try {
        await deleteDevice(deviceId)
        await loadDevicesFromApi() // Reload devices after deleting
        setCurrentPage(1) // Reset to first page after deletion
        // Hiển thị toast thành công khi xóa
        toast.success(`${t("devices.deleteSuccess")}`)
      } catch (error) {
        console.error("Failed to delete device:", error)
        
        // Hiển thị toast lỗi khi xóa thất bại
        toast.error(`${t("devices.deleteError")}`, { description: (error as any).error })
      }
    }
  }

  const handleToggleMaintenance = async (device: Device) => {
    try {
      const newStatus = device.status === 'Maintenance' ? 'Offline' : 'Maintenance'
      const confirmation = newStatus === 'Maintenance' 
        ? `${t("devices.setMaintenanceConfirm")}`
        : `${t("devices.removeMaintenanceConfirm")}`
      
      if (!confirm(confirmation)) return

      await updateDeviceStatus(device.id, newStatus)
      toast.success(
        newStatus === 'Maintenance' 
          ? `Device "${device.name}" ${t("devices.setMaintenanceSuccess")}`
          : `Device "${device.name}" ${t("devices.removeMaintenanceSuccess")}`
      )
      await loadDevicesFromApi()
    } catch (error) {
      console.error('Error toggling maintenance mode:', error)
      toast.error((error as any).error || "Failed to update device maintenance status")
    }
  }

  const getLocationString = (device: Device) => {
    // Use API factories if available, fallback to store factories
    const factoriesSource = apiFactories.length > 0 ? apiFactories : factories
    const factory = factoriesSource.find((f: any) => f.id === device.factoryId)
    
    if (apiFactories.length > 0) {
      return `${factory?.name || device.factoryId} → ${device.buildingName} → ${device.floorName} → ${device.lineName}`
    }
    
    // Original logic for store factories with full structure
    const building = factory?.buildings?.find((b: any) => b.id === device.buildingId)
    const floor = building?.floors?.find((f: any) => f.id === device.floorId)
    const line = floor?.lines?.find((l: any) => l.id === device.lineId)

    return `${factory?.name || "Unknown"} → ${building?.name || "Unknown"} → ${floor?.name || "Unknown"} → ${line?.name || "Unknown"}`
  }

  const getStatusColor = (status: Device["status"]) => {
    switch (status) {
      case "Online":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0"
      case "Offline":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0"
      case "Maintenance":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0"
      case "Error":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0"
    }
  }

  const getTypeColor = (type: Device["type"]) => {
    const colors = {
      "Sewing Machine": "from-blue-500 to-blue-600",
      "Cutting Machine": "from-purple-500 to-purple-600",
      Press: "from-orange-500 to-orange-600",
      Conveyor: "from-green-500 to-green-600",
      Other: "from-gray-500 to-gray-600",
    }
    return colors[type] || colors["Other"]
  }

  // Ensure devices is always an array for counting
  const deviceArray = Array.isArray(devices) ? devices : []
  const onlineCount = deviceArray.filter((d) => d.status === "Online").length
  const offlineCount = deviceArray.filter((d) => d.status === "Offline").length
  const maintenanceCount = deviceArray.filter((d) => d.status === "Maintenance").length
  const errorCount = deviceArray.filter((d) => d.status === "Error").length

  return (
    <MainLayout>
      <div className="space-y-6 p-2 sm:p-6 ">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h1 className="text-center sm:text-left text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {t("devices.title")}
            </h1>
            <p className="text-gray-600 mt-2">{t("devices.description")}</p>
          </div>
          <PermissionGuard
            permission="device.create"
            fallback={
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
                {t("devices.noPermissionToAdd")}
              </div>
            }
          >
            <Button 
              onClick={handleAddDevice}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("devices.addDevice")}
            </Button>
          </PermissionGuard>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">{t("devices.online")}</p>
                  <p className="text-2xl font-bold">{onlineCount}</p>
                </div>
                <Zap className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">{t("devices.offline")}</p>
                  <p className="text-2xl font-bold">{offlineCount}</p>
                </div>
                <Clock className="h-8 w-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">{t("devices.maintenance")}</p>
                  <p className="text-2xl font-bold">{maintenanceCount}</p>
                </div>
                <Gauge className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">{t("devices.error")}</p>
                  <p className="text-2xl font-bold">{errorCount}</p>
                </div>
                <Edit className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{t("devices.overview")}</CardTitle>
            <CardDescription>
              {t("common.total")}: {deviceArray.length} {t("devices")} | {t("devices.online")}: {onlineCount} | {t("devices.offline")}: {offlineCount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t("common.search")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-2 border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 border-2 border-purple-200 focus:border-purple-400">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.all")}</SelectItem>
                  <SelectItem value="Online">{t("devices.online")}</SelectItem>
                  <SelectItem value="Offline">{t("devices.offline")}</SelectItem>
                  <SelectItem value="Maintenance">{t("devices.maintenance")}</SelectItem>
                  <SelectItem value="Error">{t("devices.error")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Devices Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <TableHead className="font-semibold">{t("devices.deviceName")}</TableHead>
                  <TableHead className="font-semibold">{t("devices.deviceType")}</TableHead>
                  <TableHead className="font-semibold">{t("devices.ratedPower")}</TableHead>
                  <TableHead className="font-semibold">{t("devices.status")}</TableHead>
                  <TableHead className="font-semibold">{t("devices.location")}</TableHead>
                  <TableHead className="font-semibold">{t("devices.lastSeen")}</TableHead>
                  <TableHead className="font-semibold">{t("devices.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-purple-600 rounded-full border-t-transparent mr-2"></div>
                        Loading devices...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (!Array.isArray(paginatedDevices) || paginatedDevices.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No devices found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDevices.map((device) => {
                    const efficiency = device.status === "Online" ? 85 + Math.random() * 10 : 0
                    return (
                      <TableRow key={device.id} className="hover:bg-purple-50/50 transition-colors">
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>
                          <Badge className={`bg-gradient-to-r ${getTypeColor(device.type)} text-white border-0`}>
                            {device.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {device.ratedPower.toFixed(2)} {t("units.kw")}
                            </div>
                            <Progress value={efficiency} className="h-1" />
                            <div className="text-xs text-gray-500">{efficiency.toFixed(1)}% efficiency</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
                            <PermissionGuard
                              permission="device.edit"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-6 text-xs ${
                                  device.status === 'Maintenance' 
                                    ? 'bg-blue-50 hover:bg-blue-100' 
                                    : 'hover:bg-yellow-50'
                                }`}
                                onClick={() => handleToggleMaintenance(device)}
                              >
                                {device.status === "Maintenance" ? `🔧 ${t("devices.exitMaintenance")}` : `🔧 ${t("devices.maintenance")}`}
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{getLocationString(device)}</TableCell>
                        <TableCell>{device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PermissionGuard
                              permission="device.view"
                              fallback={
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:bg-blue-100"
                                onClick={() => handleViewDevice(device)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                            
                            <PermissionGuard
                              permission="device.edit"
                              fallback={
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:bg-green-100"
                                onClick={() => handleEditDevice(device)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                            
                            <PermissionGuard
                              permission="device.delete"
                              fallback={
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled
                                  className="opacity-50 cursor-not-allowed"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDevice(device.id)}
                                className="hover:bg-red-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PermissionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={safeFilteredDevices.length}
          showInfo={true}
          t={t}
          itemName={t("devices")}
        />
      </div>

      {/* Device Modal */}
      <DeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        device={selectedDevice}
        factories={apiFactories.length > 0 ? apiFactories : factories}
        onSave={handleModalSave}
        loading={modalLoading}
        onDeviceUpdated={async () => {
          // Refresh device data sau khi thêm/xóa connections
          if (selectedDevice?.id) {
            try {
              const updatedDevice = await getDeviceById(selectedDevice.id)
              setSelectedDevice(updatedDevice)
              // Cũng reload toàn bộ danh sách devices
              await loadDevicesFromApi()
            } catch (error) {
              console.error("Failed to refresh device data:", error)
            }
          }
        }}
      />
    </MainLayout>
  )
}
