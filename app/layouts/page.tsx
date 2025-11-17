"use client"

import type React from "react"

import { MainLayout } from "@/components/layout/main-layout"
import { PermissionGuard } from "@/components/PermissionGuard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TimezoneCombobox from "@/components/ui/combobox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { BuildingApiService, DeviceApiService, FactoryApiService, FloorApiService, LineApiService } from "@/lib/api"
import { authService } from "@/lib/auth"
import { useTranslation } from "@/lib/i18n"
import type { Building, Device, Factory, Floor, Line } from "@/lib/types"
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Edit2,
    Move,
    Pause,
    Play,
    Plus,
    Search,
    Users,
    X,
    Zap
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface LayoutStats {
uptime: number
downtime: number
errorTime: number
runningTime: number
powerConsumption: number
deviceCount: number
efficiency: number
}

interface LineDetails {
id: string
name: string
devices: Device[]
totalPower: number
uptime: number
downtime: number
errorTime: number
runningTime: number
alerts: number
efficiency: number
powerTrend: Array<{ time: string; power: number }>
}

type ViewLevel = "factory" | "building" | "floor" | "line" | "device"

export default function LayoutsPage() {
const [currentLevel, setCurrentLevel] = useState<ViewLevel>("factory")
const [selectedFactoryId, setSelectedFactoryId] = useState<string | null>(null)
const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)
const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
const [searchTerm, setSearchTerm] = useState("")
const [stats, setStats] = useState<Map<string, LayoutStats>>(new Map())
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: string } | null>(null)
const [draggedDevice, setDraggedDevice] = useState<Device | null>(null)
const [externalDevices, setExternalDevices] = useState<Device[]>([])
const [isDeviceRelocationOpen, setIsDeviceRelocationOpen] = useState(false)
const [selectedDeviceForMove, setSelectedDeviceForMove] = useState<Device | null>(null)
const [targetLocation, setTargetLocation] = useState({
    factoryId: "",
    buildingId: "",
    floorId: "",
    lineId: "",
})
const [selectedLineDetails, setSelectedLineDetails] = useState<LineDetails | null>(null)
const [isLineDetailsOpen, setIsLineDetailsOpen] = useState(false)
const [isAddFactoryOpen, setIsAddFactoryOpen] = useState(false)
const [isAddBuildingOpen, setIsAddBuildingOpen] = useState(false)
const [isAddFloorOpen, setIsAddFloorOpen] = useState(false)
const [isAddLineOpen, setIsAddLineOpen] = useState(false)
const [newFactoryName, setNewFactoryName] = useState("")
const [newLocation, setNewLocation] = useState("")
const [newTimezone, setNewTimezone] = useState("")
const [newBuildingName, setNewBuildingName] = useState("")
const [newFloorName, setNewFloorName] = useState("")
const [newLineName, setNewLineName] = useState("")
const [externalDeviceSearchTerm, setExternalDeviceSearchTerm] = useState("")

// API states
const [apiFactories, setApiFactories] = useState<Factory[]>([])
const [apiBuildings, setApiBuildings] = useState<Building[]>([])
const [apiFloors, setApiFloors] = useState<Floor[]>([])
const [apiLines, setApiLines] = useState<Line[]>([])
const [apiDevices, setApiDevices] = useState<Device[]>([])
const [loading, setLoading] = useState(false)

    // Local state for user and language
const [currentUser, setCurrentUser] = useState<any>(null)

const { t } = useTranslation()

// Helper functions for access control
const filterFactoriesByAccess = (factories: Factory[]) => {
    if (!currentUser?.factoryAccess || currentUser.factoryAccess.length === 0) {
        return factories // No restrictions if no access defined
    }
    return factories.filter(factory => currentUser.factoryAccess.includes(factory.id))
}

const filterBuildingsByAccess = (buildings: Building[]) => {
    if (!currentUser?.buildingAccess || currentUser.buildingAccess.length === 0) {
        return buildings // No restrictions if no access defined
    }
    return buildings.filter(building => currentUser.buildingAccess.includes(building.id))
}

const filterFloorsByAccess = (floors: Floor[]) => {
    if (!currentUser?.floorAccess || currentUser.floorAccess.length === 0) {
        return floors // No restrictions if no access defined
    }
    return floors.filter(floor => currentUser.floorAccess.includes(floor.id))
}

const filterLinesByAccess = (lines: Line[]) => {
    if (!currentUser?.lineAccess || currentUser.lineAccess.length === 0) {
        return lines // No restrictions if no access defined
    }
    return lines.filter(line => currentUser.lineAccess.includes(line.id))
}

const filterDevicesByAccess = (devices: Device[]) => {
    // Devices are filtered based on line access since devices belong to lines
    if (!currentUser?.lineAccess || currentUser.lineAccess.length === 0) {
        return devices // No restrictions if no access defined
    }
    return devices.filter(device => currentUser.lineAccess.includes(device.lineId))
}

// Calculate operational time for devices
const calculateOperationalTime = (device: Device) => {
    const totalShiftTime = 480 // 8 hours in minutes

    if (device.status === "Online") {
    const runningTime = totalShiftTime * (0.75 + Math.random() * 0.15) // 75-90%
    const errorTime = totalShiftTime * (0.02 + Math.random() * 0.08) // 2-10%
    const downtime = totalShiftTime - runningTime - errorTime
    return { runningTime, downtime, errorTime, totalShiftTime }
    } else if (device.status === "Error") {
    const errorTime = totalShiftTime * (0.3 + Math.random() * 0.4) // 30-70%
    const runningTime = totalShiftTime * (0.1 + Math.random() * 0.2) // 10-30%
    const downtime = totalShiftTime - runningTime - errorTime
    return { runningTime, downtime, errorTime, totalShiftTime }
    } else if (device.status === "Maintenance") {
    const downtime = totalShiftTime * (0.5 + Math.random() * 0.3) // 50-80%
    const runningTime = totalShiftTime * (0.1 + Math.random() * 0.2) // 10-30%
    const errorTime = totalShiftTime - runningTime - downtime
    return { runningTime, downtime, errorTime, totalShiftTime }
    } else {
    // Offline
    return { runningTime: 0, downtime: totalShiftTime, errorTime: 0, totalShiftTime }
    }
}

const calculateStats = async (deviceList: Device[]): Promise<LayoutStats> => {
    let totalPower = 0
    let totalRunningTime = 0
    let totalDowntime = 0
    let totalErrorTime = 0
    let onlineDevices = 0

    for (const device of deviceList) {
    const operationalTime = calculateOperationalTime(device)
    totalRunningTime += operationalTime.runningTime
    totalDowntime += operationalTime.downtime
    totalErrorTime += operationalTime.errorTime

    if (device.status === "Online") {
        onlineDevices++
        // Mock power data since we're using API instead of database
        const mockPower = device.ratedPower * (0.7 + Math.random() * 0.3) // 70-100% of rated power
        totalPower += mockPower
    }
    }

    const avgRunningTime = deviceList.length > 0 ? totalRunningTime / deviceList.length : 0
    const avgDowntime = deviceList.length > 0 ? totalDowntime / deviceList.length : 0
    const avgErrorTime = deviceList.length > 0 ? totalErrorTime / deviceList.length : 0
    const efficiency = deviceList.length > 0 ? (avgRunningTime / 480) * 100 : 0

    return {
    uptime: onlineDevices,
    downtime: deviceList.length - onlineDevices,
    errorTime: avgErrorTime,
    runningTime: avgRunningTime,
    powerConsumption: totalPower * 24,
    deviceCount: deviceList.length,
    efficiency,
    }
}

// Load data from APIs
// Generic function to load data from API
// const loadDataFromApi = async (
//     apiCall: () => Promise<any>,
//     setState: (data: any[]) => void,
//     errorMessage: string,
//     setEmptyOnError: boolean = true
// ) => {
//     try {
//         setLoading(true)
//         const response = await apiCall()
//         setState(response)
//     } catch (error: any) {
//         console.error('Error loading data:', error)
        
//         // Import utility function dynamically
//         const { isAuthenticationError } = await import('../../lib/api')
        
//         // Check if it's an authentication error
//         if (isAuthenticationError(error)) {
//             // Authentication error - user will be redirected to login by api.ts
//             // Don't show error toast as user is being logged out
//             return
//         }
        
//         // For other errors, show toast
//         toast.error(errorMessage)
//         if (setEmptyOnError) {
//             setState([])
//         }
//     } finally {
//         setLoading(false)
//     }
// }

// const loadFactoriesFromApi = async () => {
//     await loadDataFromApi(
//         getFactories,
//         setApiFactories,
//         'Không thể tải danh sách nhà máy từ API',
//         false // Don't set empty on error for factories
//     )
// }

// const loadBuildingsFromApi = async (factoryId: string) => {
//     await loadDataFromApi(
//         () => getBuildingsByFactory(factoryId),
//         setApiBuildings,
//         'Không thể tải danh sách tòa nhà'
//     )
// }

// const loadFloorsFromApi = async (buildingId: string) => {
//     await loadDataFromApi(
//         () => getFloorsByBuilding(buildingId),
//         setApiFloors,
//         'Không thể tải danh sách tầng'
//     )
// }

// const loadLinesFromApi = async (floorId: string) => {
//     await loadDataFromApi(
//         () => getLinesByFloor(floorId),
//         setApiLines,
//         'Không thể tải danh sách dây chuyền'
//     )
// }

// const loadDevicesFromApi = async () => {
//     try {
//         setLoading(true)
//         const response = await getDevices() as any // Type assertion to handle complex response types
        
//         // Handle response format - simplify type handling
//         let deviceArray: Device[] = []
        
//         if (Array.isArray(response)) {
//             deviceArray = response
//         } else if (response && typeof response === 'object') {
//             // Try to extract data property safely
//             const responseData = response.data
//             if (responseData) {
//                 deviceArray = Array.isArray(responseData) ? responseData : [responseData]
//             } else if (response.success && response.data) {
//                 deviceArray = Array.isArray(response.data) ? response.data : [response.data]
//             }
//         }
        
//         setApiDevices(deviceArray)
//     } catch (error) {
//         console.error('Error loading devices:', error)
//         toast.error('Không thể tải danh sách thiết bị')
//         setApiDevices([])
//     } finally {
//         setLoading(false)
//     }
// }

const fetchData = async () => {
    setLoading(true)
    try {
        const [factories, buildings, floors, lines, devicesData] = await Promise.all([
            FactoryApiService.getFactories(),
            BuildingApiService.getBuildings(),
            FloorApiService.getFloors(),
            LineApiService.getLines(),
            // Load devices với minimal mode và limit 200 cho layouts view
            DeviceApiService.getDevices({ limit: 200, minimal: false})
        ])
        setApiFactories(factories)
        setApiBuildings(buildings)
        setApiFloors(floors)
        setApiLines(lines)
        
        // Handle devices response
        let deviceArray: Device[] = []
        if (Array.isArray(devicesData)) {
            deviceArray = devicesData
        } else if (devicesData && typeof devicesData === 'object') {
            const deviceObj = devicesData as any
            if ('data' in deviceObj && Array.isArray(deviceObj.data)) {
                deviceArray = deviceObj.data
            } else {
                deviceArray = []
            }
        }
        setApiDevices(deviceArray)
    } catch (error) {
        console.error('Error loading data:', error)
    } finally {
        setLoading(false)
    }
}
const loadStats = async () => {
    const newStats = new Map<string, LayoutStats>()

    // Use only API data now
    const currentFactories = apiFactories
    const currentDevices = apiDevices

    for (const factory of currentFactories) {
    const factoryDevices = currentDevices.filter((d) => d.factoryId === factory.id)
    newStats.set(`factory-${factory.id}`, await calculateStats(factoryDevices))

    // For API data, we need to load buildings, floors, lines separately
    if (apiFactories.length > 0) {
        try {
        const buildingsResponse = await BuildingApiService.getBuildingsByFactory(factory.id)
        
        for (const building of buildingsResponse) {
            const buildingDevices = currentDevices.filter((d) => d.buildingId === building.id)
            newStats.set(`building-${building.id}`, await calculateStats(buildingDevices))

            const floorsResponse = await FloorApiService.getFloorsByBuilding(building.id)
            
            for (const floor of floorsResponse) {
            const floorDevices = currentDevices.filter((d) => d.floorId === floor.id)
            newStats.set(`floor-${floor.id}`, await calculateStats(floorDevices))

            const linesResponse = await LineApiService.getLinesByFloor(floor.id)
            
            for (const line of linesResponse) {
                const lineDevices = currentDevices.filter((d) => d.lineId === line.id)
                newStats.set(`line-${line.id}`, await calculateStats(lineDevices))
            }
            }
        }
        } catch (error) {
        console.error('Error loading nested data for factory:', factory.id, error)
        }
    }
    }

    setStats(newStats)
}

const loadExternalDevices = async () => {
    if (selectedFloorId) {
    // Use API devices instead of database
    // Get devices that are NOT on the current floor and user has access to
        const accessibleDevices = filterDevicesByAccess(apiDevices)
        const external = accessibleDevices.filter((device) => device.floorId !== selectedFloorId)
        setExternalDevices(external)
    }
}

const loadLineDetails = async (lineId: string) => {
    let line = null
    
    // Use only API data now
    if (apiLines.length > 0) {
    line = apiLines.find((l) => l.id === lineId)
    }

    if (!line) return

    // Use only API devices now
    const currentDevices = apiDevices
    const lineDevices = currentDevices.filter((d) => d.lineId === lineId)
    const onlineDevices = lineDevices.filter((d) => d.status === "Online")

    let totalPower = 0
    let totalRunningTime = 0
    let totalDowntime = 0
    let totalErrorTime = 0

    for (const device of lineDevices) {
    const operationalTime = calculateOperationalTime(device)
    totalRunningTime += operationalTime.runningTime
    totalDowntime += operationalTime.downtime
    totalErrorTime += operationalTime.errorTime

    if (device.status === "Online") {
        // Mock power data since we're using API instead of database
        const mockPower = device.ratedPower * (0.7 + Math.random() * 0.3) // 70-100% of rated power
        totalPower += mockPower
    }
    }

    // Generate power trend for last 24 hours
    const powerTrend = []
    for (let i = 23; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60 * 60 * 1000)
    const hourlyPower = totalPower * (0.8 + Math.random() * 0.4)
    powerTrend.push({
        time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        power: hourlyPower,
    })
    }

    const lineDetails: LineDetails = {
    id: lineId,
    name: line.name,
    devices: lineDevices,
    totalPower,
    uptime: onlineDevices.length,
    downtime: lineDevices.length - onlineDevices.length,
    errorTime: totalErrorTime / lineDevices.length,
    runningTime: totalRunningTime / lineDevices.length,
    alerts: Math.floor(Math.random() * 3),
    efficiency: lineDevices.length > 0 ? (totalRunningTime / lineDevices.length / 480) * 100 : 0,
    powerTrend,
    }

    setSelectedLineDetails(lineDetails)
}

useEffect(() => {
    // Load initial data from APIs
    fetchData()
    // Load current user
    const loadCurrentUser = async () => {
        try {
            const user = await authService.fetchCurrentUser()
            setCurrentUser(user)
        } catch (error) {
            console.error('Error loading current user:', error)
        }
    }
    loadCurrentUser()
}, [])

useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, 10000)
    return () => clearInterval(interval)
}, [apiDevices, apiFactories]) // Only depend on API data now

// useEffect(() => {
//     if (currentLevel === "building" && selectedFactoryId) {
//     loadBuildingsFromApi(selectedFactoryId)
//     }
// }, [currentLevel, selectedFactoryId])

// useEffect(() => {
//     if (currentLevel === "floor" && selectedBuildingId) {
//     loadFloorsFromApi(selectedBuildingId)
//     }
// }, [currentLevel, selectedBuildingId])

useEffect(() => {
    if (currentLevel === "line" && selectedFloorId) {
    // loadLinesFromApi(selectedFloorId)
    loadExternalDevices()
    }
}, [currentLevel, selectedFloorId, apiDevices]) // Add apiDevices dependency

// Separate effect to reload external devices when API data changes
// useEffect(() => {
//     if (currentLevel === "line" && selectedFloorId && apiDevices.length > 0) {
//     loadExternalDevices()
//     }
// }, [apiDevices, apiFactories, apiBuildings, apiFloors, apiLines]) // Reload when any API data changes

const handleBack = () => {
    switch (currentLevel) {
    case "building":
        setCurrentLevel("factory")
        setSelectedFactoryId(null)
        break
    case "floor":
        setCurrentLevel("building")
        setSelectedBuildingId(null)
        break
    case "line":
        setCurrentLevel("floor")
        setSelectedFloorId(null)
        break
    case "device":
        setCurrentLevel("line")
        setSelectedLineId(null)
        break
    }
}

const handleEdit = async (id: string, name: string, type: string) => {
    setEditingItem({ id, name, type })
    // console.log('Editing item:', { id, name, type })
    // switch (type) {
    //     case "nhà máy":
    //         if (!currentUser?.permissions?.includes("layout.edit_factory")) {
    //             toast.error("Bạn không có quyền chỉnh sửa nhà máy")
    //             return
    //         } else await FactoryApiService.updateFactory(id, { name })
    //         break
    //     case "tầng":
    //         if (!currentUser?.permissions?.includes("layout.edit_floor")) {
    //             toast.error("Bạn không có quyền chỉnh sửa tầng")
    //             return
    //         }
    //         break
    //     case "dòng":
    //         if (!currentUser?.permissions?.includes("layout.edit_line")) {
    //             toast.error("Bạn không có quyền chỉnh sửa dòng")
    //             return
    //         }
    //         break
    //     case "thiết bị":
    //         if (!currentUser?.permissions?.includes("layout.edit_device")) {
    //             toast.error("Bạn không có quyền chỉnh sửa thiết bị")
    //             return
    //         }
    //         break
    // }
    setIsEditDialogOpen(true)
}

const handleSave = async () => {
    if (!editingItem) return
    try {
        switch (editingItem.type) {
            case "nhà máy":
                if (!currentUser?.permissions?.includes("layout.edit")) {
                    toast.error("Bạn không có quyền chỉnh sửa nhà máy")
                    return
                }
                await FactoryApiService.updateFactory(editingItem.id, { name: editingItem.name })
                toast.success("Đã lưu thay đổi nhà máy")
                // Refresh factories
                const factories = await FactoryApiService.getFactories()
                setApiFactories(factories)
                break

            case "tòa nhà":
                if (!currentUser?.permissions?.includes("layout.edit")) {
                    toast.error("Bạn không có quyền chỉnh sửa tòa nhà")
                    return
                }
                await BuildingApiService.updateBuilding(editingItem.id, { name: editingItem.name })
                toast.success("Đã lưu thay đổi tòa nhà")
                // Refresh buildings
                const buildings = await BuildingApiService.getBuildings()
                setApiBuildings(buildings)
                break

            case "tầng":
                if (!currentUser?.permissions?.includes("layout.edit")) {
                    toast.error("Bạn không có quyền chỉnh sửa tầng")
                    return
                }
                await FloorApiService.updateFloor(editingItem.id, { name: editingItem.name })
                toast.success("Đã lưu thay đổi tầng")
                // Refresh floors
                const floors = await FloorApiService.getFloors()
                setApiFloors(floors)
                break
            case "dây chuyền":
                if (!currentUser?.permissions?.includes("layout.edit")) {
                    toast.error("Bạn không có quyền chỉnh sửa dây chuyền")
                    return
                }
                await LineApiService.updateLine(editingItem.id, { name: editingItem.name })
                toast.success("Đã lưu thay đổi dây chuyền")
                // Refresh lines
                const lines = await LineApiService.getLines()
                setApiLines(lines)
                break
        }
        setIsEditDialogOpen(false)
        setEditingItem(null)
    } catch (error) {
        console.error('Error saving changes:', error)
        toast.error('Không thể lưu thay đổi')
    }
}

const handleDeviceMove = (device: Device) => {
    setSelectedDeviceForMove(device)
    setTargetLocation({
    factoryId: device.factoryId,
    buildingId: device.buildingId,
    floorId: device.floorId,
    lineId: device.lineId,
    })
    setIsDeviceRelocationOpen(true)
}

const handleLineDetails = async (lineId: string) => {
    await loadLineDetails(lineId)
    setIsLineDetailsOpen(true)
}

const confirmDeviceMove = async () => {
    if (!selectedDeviceForMove || !currentUser) return

    // Mock device move operation since we're using API instead of database
    // In real implementation, you would call an API to move the device
    try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Update local state - find and update the device in apiDevices
    const updatedDevices = apiDevices.map(device => 
        device.id === selectedDeviceForMove.id 
        ? { 
            ...device, 
            factoryId: targetLocation.factoryId,
            buildingId: targetLocation.buildingId,
            floorId: targetLocation.floorId,
            lineId: targetLocation.lineId
            }
        : device
    )
    setApiDevices(updatedDevices)
    
    // Mock audit log (in real implementation, this would be sent to API)
    // console.log('Device moved:', {
    //     userId: currentUser.id,
    //     username: currentUser.username,
    //     action: "MOVE_DEVICE",
    //     resource: `DEVICE:${selectedDeviceForMove.id}`,
    //     timestamp: new Date().toISOString(),
    //     details: {
    //     deviceId: selectedDeviceForMove.id,
    //     from: {
    //         factoryId: selectedDeviceForMove.factoryId,
    //         buildingId: selectedDeviceForMove.buildingId,
    //         floorId: selectedDeviceForMove.floorId,
    //         lineId: selectedDeviceForMove.lineId,
    //     },
    //     to: targetLocation,
    //     },
    // })

    toast.success('Thiết bị đã được di chuyển thành công')
    await loadStats()
    await loadExternalDevices()
    } catch (error) {
    console.error('Error moving device:', error)
    toast.error('Không thể di chuyển thiết bị')
    }

    setIsDeviceRelocationOpen(false)
    setSelectedDeviceForMove(null)
}

const handleDragStart = (e: React.DragEvent, device: Device) => {
    // console.log('Drag started:', {
    //     deviceId: device.id,
    //     deviceName: device.name,
    //     fromLocation: {
    //         factoryId: device.factoryId,
    //         buildingId: device.buildingId,
    //         floorId: device.floorId,
    //         lineId: device.lineId
    //     }
    // })
    e.dataTransfer.setData("text/plain", device.id)
    setDraggedDevice(device)
}

const handleDragOver = (e: React.DragEvent) => {
    // console.log('Drag over element')
    e.preventDefault()
    e.stopPropagation()
}

const handleDrop = async (e: React.DragEvent, targetFactoryId: string, targetBuildingId: string, targetFloorId: string, targetLineId: string) => {
    // console.log('Drop event:', {
    //     targetFactoryId,
    //     targetBuildingId,
    //     targetFloorId,
    //     targetLineId
    // })
    e.preventDefault()
    e.stopPropagation()

    const deviceId = e.dataTransfer.getData("text/plain")
    // console.log('Device ID from dataTransfer:', deviceId)
    const device = apiDevices.find((d) => d.id === deviceId) // Use apiDevices instead of devices
    // console.log('Found device:', device)

    if (!device || !currentUser) {
        // console.log('No device found or no current user')
        toast.error('Không thể di chuyển thiết bị')
        return
    }

    const targetLine = apiLines.find((l) => l.id === targetLineId) // Use apiLines instead of complex lookup
    // console.log('Target line:', targetLine)
    if (!targetLine) {
        // console.log('No target line found')
        toast.error('Không thể di chuyển thiết bị')
        return
    }

    // Mock drag-drop device move operation since we're using API instead of database
    try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Update local state - find and update the device in apiDevices
    const updatedDevices = apiDevices.map(d => 
        d.id === device.id 
        ? { ...d, factoryId: targetFactoryId, buildingId: targetBuildingId, floorId: targetFloorId, lineId: targetLineId }
        : d
    )
    setApiDevices(updatedDevices)
    
    // Update device via API
    await DeviceApiService.updateDevice(device.id, { factoryId: targetFactoryId, buildingId: targetBuildingId, floorId: targetFloorId, lineId: targetLineId })
    // console.log('Device updated via API')
    // // Mock audit log (in real implementation, this would be sent to API)
    // console.log('Device drag-dropped:', {
    //     userId: currentUser.id,
    //     username: currentUser.username,
    //     action: "DRAG_DROP_DEVICE",
    //     resource: `DEVICE:${device.id}`,
    //     timestamp: new Date().toISOString(),
    //     details: {
    //     deviceId: device.id,
    //     targetFactoryId,
    //     targetBuildingId,
    //     targetFloorId,
    //     targetLineId,
    //     },
    // })

    toast.success('Thiết bị đã được di chuyển thành công')
    // console.log('Reloading stats and external devices')
    await loadStats()
    await loadExternalDevices()
    } catch (error) {
    console.error('Error moving device:', error)
    toast.error('Không thể di chuyển thiết bị')
    }

setDraggedDevice(null)
// console.log('Drag operation completed')
}
const handleAddFactory = async () => {
    if (!newFactoryName.trim()) return

    try {
    await FactoryApiService.createFactory({
        name: newFactoryName.trim(),
        location: newLocation.trim() || "Unknown",
        timezone: newTimezone || "UTC"
    })
    toast.success("Đã thêm nhà máy thành công")
    setNewFactoryName("")
    setIsAddFactoryOpen(false)
    // Refresh data
    const factories = await FactoryApiService.getFactories()
    setApiFactories(factories)
    } catch (error) {
    toast.error("Không thể thêm nhà máy")
    }
}

const handleAddBuilding = async () => {
    if (!newBuildingName.trim() || !selectedFactoryId) return

    try {
    await BuildingApiService.createBuilding({
        name: newBuildingName.trim(),
        factoryId: selectedFactoryId
    })
    toast.success("Đã thêm tòa nhà thành công")
    setNewBuildingName("")
    setIsAddBuildingOpen(false)
    // Refresh data
    const buildings = await BuildingApiService.getBuildingsByFactory(selectedFactoryId)
    setApiBuildings(buildings)
    } catch (error) {
    toast.error("Không thể thêm tòa nhà")
    }
}

const handleAddFloor = async () => {
    if (!newFloorName.trim() || !selectedBuildingId) return

    try {
    await FloorApiService.createFloor({
        name: newFloorName.trim(),
        buildingId: selectedBuildingId
    })
    toast.success("Đã thêm tầng thành công")
    setNewFloorName("")
    setIsAddFloorOpen(false)
    // Refresh data
    const floors = await FloorApiService.getFloorsByBuilding(selectedBuildingId)
    setApiFloors(floors)
    } catch (error) {
    toast.error("Không thể thêm tầng")
    }
}

const handleAddLine = async () => {
    if (!newLineName.trim() || !selectedFloorId) return

    try {
    await LineApiService.createLine({
        name: newLineName.trim(),
        floorId: selectedFloorId
    })
    toast.success("Đã thêm dây chuyền thành công")
    setNewLineName("")
    setIsAddLineOpen(false)
    // Refresh data
    const lines = await LineApiService.getLinesByFloor(selectedFloorId)
    setApiLines(lines)
    } catch (error) {
    toast.error("Không thể thêm dây chuyền")
    }
}
const renderFactoryView = () => {
    // Use only API data now
    const currentFactories = filterFactoriesByAccess(apiFactories)
    const filteredFactories = currentFactories.filter((factory) =>
    factory.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (loading && filteredFactories.length === 0) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
            <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
            </CardContent>
            </Card>
        ))}
        </div>
    )
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFactories.map((factory, index) => {
                const factoryStats = stats.get(`factory-${factory.id}`)
                const colors = [
                    "from-blue-500 to-blue-600",
                    "from-green-500 to-green-600",
                    "from-purple-500 to-purple-600",
                    "from-orange-500 to-orange-600",
                    "from-pink-500 to-pink-600",
                ]
                const colorClass = colors[index % colors.length]

                return (
                    <Card
                    key={factory.id}
                    className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br ${colorClass} text-white border-0`}
                    onClick={() => {
                        setSelectedFactoryId(factory.id)
                        setCurrentLevel("building")
                    }}
                    >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium text-white">{factory.name}</CardTitle>
                        <PermissionGuard permission="layout.edit">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(factory.id, factory.name, "nhà máy")
                                }}
                                >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </PermissionGuard>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                            <Play className="h-4 w-4 text-white/80" />
                            <div>
                                <div className="text-sm text-white/80">{t("layouts.runningtime")}</div>
                                <div className="font-medium text-white">
                                {factory.operationalTime?.runningTime?.toFixed(0) || 0} {t("layouts.minutes")}
                                </div>
                            </div>
                            </div>
                            <div className="flex items-center space-x-2">
                            <Pause className="h-4 w-4 text-white/80" />
                            <div>
                                <div className="text-sm text-white/80">{t("layouts.downtime")}</div>
                                <div className="font-medium text-white">
                                {factoryStats?.downtime || 0} {t("layouts.devices")}
                                </div>
                            </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-white/80" />
                            <div>
                                <div className="text-sm text-white/80">{t("layouts.errortime")}</div>
                                <div className="font-medium text-white">
                                {factory.operationalTime?.errorTime?.toFixed(0) || 0} {t("layouts.minutes")}
                                </div>
                            </div>
                            </div>
                            <div className="flex items-center space-x-2">
                            <Zap className="h-4 w-4 text-white/80" />
                            <div>
                                <div className="text-sm text-white/80">{t("layouts.powerConsumption")}</div>
                                <div className="font-medium text-white">
                                {factory.power?.toFixed(1) || 0} {t("layouts.kwh")}
                                </div>
                            </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-white/20">
                            <div className="flex justify-between items-center">
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                                {factory.buildingCount || 0} {t("layouts.building")}
                            </Badge>
                            <div className="text-right">
                                <div className="text-sm text-white/80">{t("layouts.efficiency")}</div>
                                <div className="font-bold text-white">{factory.operationalTime?.uptimePercentage || 0}%</div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </CardContent>
                    </Card>
                )
                })}
            </div>
        </div>
    )
}

const renderBuildingView = () => {
    // Use only API data now
    const buildings = getAvailableBuildings()

    const filteredBuildings = buildings.filter((building) =>
    building.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (loading && filteredBuildings.length === 0) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
            <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
            </CardContent>
            </Card>
        ))}
        </div>
    )
    }

    return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBuildings.map((building, index) => {
        const buildingStats = stats.get(`building-${building.id}`)
        const colors = [
            "from-indigo-500 to-indigo-600",
            "from-teal-500 to-teal-600",
            "from-rose-500 to-rose-600",
            "from-amber-500 to-amber-600",
            "from-cyan-500 to-cyan-600",
        ]
        const colorClass = colors[index % colors.length]

        return (
            <Card
            key={building.id}
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br ${colorClass} text-white border-0`}
            onClick={() => {
                setSelectedBuildingId(building.id)
                setCurrentLevel("floor")
            }}
            >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-white">{building.name}</CardTitle>
                <PermissionGuard permission="layout.edit">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(building.id, building.name, "tòa nhà")
                        }}
                        >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </PermissionGuard>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4 text-white/80" />
                    <div>
                        <div className="text-sm text-white/80">{t("layouts.runningtime")}</div>
                        <div className="font-medium text-white">
                        {building.operationalTime?.runningTime?.toFixed(0) ?? 0} {t("layouts.minutes")}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Pause className="h-4 w-4 text-white/80" />
                    <div>
                        <div className="text-sm text-white/80">{t("layouts.deviceDownTime")}</div>
                        <div className="font-medium text-white">
                        {buildingStats?.downtime || 0} {t("layouts.devices")}
                        </div>
                    </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-white/80" />
                    <div>
                        <div className="text-sm text-white/80">{t("layouts.errortime")}</div>
                        <div className="font-medium text-white">
                        {building.operationalTime?.errorTime?.toFixed(0) ?? 0} {t("layouts.minutes")}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-white/80" />
                    <div>
                        <div className="text-sm text-white/80">{t("layouts.powerConsumption")}</div>
                        <div className="font-medium text-white">
                        {building.power?.toFixed(1) ?? 0} {t("layouts.kwh")}
                        </div>
                    </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-white/20">
                    <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {building.floorCount || 0} {t("layouts.floor")}
                    </Badge>
                    <div className="text-right">
                        <div className="text-sm text-white/80">{t("layouts.efficiency")}</div>
                        <div className="font-bold text-white">{building.operationalTime.uptimePercentage?.toFixed(1) || 0}%</div>
                    </div>
                    </div>
                </div>
                </div>
            </CardContent>
            </Card>
        )
        })}
    </div>
    )
}

const renderFloorView = () => {
    // Use only API data now
    const floors = getAvailableFloors()

    const filteredFloors = floors.filter((floor) =>
    floor.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (loading && filteredFloors.length === 0) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
            <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                </div>
            </CardContent>
            </Card>
        ))}
        </div>
    )
    }

    return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFloors.map((floor, index) => {
        const floorStats = stats.get(`floor-${floor.id}`)
        const colors = [
            "from-emerald-500 to-emerald-600",
            "from-violet-500 to-violet-600",
            "from-orange-500 to-orange-600",
            "from-sky-500 to-sky-600",
            "from-red-500 to-red-600",
        ]
        const colorClass = colors[index % colors.length]

        return (
            <Card
            key={floor.id}
            className={`cursor-pointer hover:shadow-lg transition-all duration-200 bg-gradient-to-br ${colorClass} text-white border-0`}
            onClick={() => {
                setSelectedFloorId(floor.id)
                setCurrentLevel("line")
            }}
            >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-white">{floor.name}</CardTitle>
                <PermissionGuard permission="layout.edit">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(floor.id, floor.name, "tầng")
                        }}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                </PermissionGuard>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4 text-white/80" />
                    <div>
                        <div className="text-sm text-white/80">{t("layouts.runningtime")}</div>
                        <div className="font-medium text-white">
                        {floor?.operationalTime.runningTime.toFixed(0) || 0} {t("layouts.minutes")}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Pause className="h-4 w-4 text-white/80" />
                    <div>
                        <div className="text-sm text-white/80">{t("layouts.deviceDownTime")}</div>
                        <div className="font-medium text-white">
                        {floorStats?.downtime || 0} {t("layouts.devices")}
                        </div>
                    </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-white/80" />
                    <div>
                        <div className="text-sm text-white/80">{t("layouts.errortime")}</div>
                        <div className="font-medium text-white">
                        {floor?.operationalTime.errorTime.toFixed(0) || 0} {t("layouts.minutes")}
                        </div>
                    </div>
                    </div>
                    <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-white/80" />
                    <div>
                        <div className="text-sm text-white/80">{t("layouts.powerConsumption")}</div>
                        <div className="font-medium text-white">
                        {floor?.power.toFixed(1) || 0} {t("layouts.kwh")}
                        </div>
                    </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-white/20">
                    <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {floor.lineCount || 0} {t("layouts.line")}
                    </Badge>
                    <div className="text-right">
                        <div className="text-sm text-white/80">{t("layouts.efficiency")}</div>
                        <div className="font-bold text-white">{floorStats?.efficiency.toFixed(1) || 0}%</div>
                    </div>
                    </div>
                </div>
                </div>
            </CardContent>
            </Card>
        )
        })}
    </div>
    )
}

const renderLineView = () => {
    // Use only API data now
    const lines = getAvailableLines()

    const filteredLines = lines.filter((line) => line.name.toLowerCase().includes(searchTerm.toLowerCase()))

    // Use only API devices now
    const currentDevices = filterDevicesByAccess(apiDevices)

    if (loading && filteredLines.length === 0) {
    return (
        <div className="flex gap-6">
        <div className="flex-1">
            <div className="space-y-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                <CardHeader>
                    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                    <div className="grid grid-cols-4 gap-4 mt-3">
                    {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-4 bg-gray-300 rounded w-full"></div>
                    ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                    </div>
                </CardContent>
                </Card>
            ))}
            </div>
        </div>
        </div>
    )
    }

    return (
    <div className="flex flex-col md:flex-row gap-6">
        {/* Lines Grid */}
        <div className="flex-1">
        <div className="space-y-6">
            {filteredLines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
                {t("layouts.searchLineFail")} "{searchTerm}"
            </div>
            ) : (
            filteredLines.map((line) => {
                const lineStats = stats.get(`line-${line.id}`);
                const lineDevices = currentDevices.filter((d) => d.lineId === line.id);

                // Derive the correct target IDs from the relationships (line -> floor -> building -> factory)
                const targetFloor = apiFloors.find((f) => f.id === line.floorId);
                const targetBuilding = apiBuildings.find((b) => b.id === targetFloor?.buildingId);
                const targetFactory = apiFactories.find((fa) => fa.id === targetBuilding?.factoryId);

                return (
                <Card
                    key={line.id}
                        className={`transition-all duration-200 bg-white/80 backdrop-blur-sm border-0 shadow-lg ${
                        draggedDevice ? "border-2 border-dashed border-green-300 bg-green-50/50" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove("border-green-500", "bg-green-100/50");
                    }}
                    onDrop={(e) => handleDrop(
                        e,
                        // handleDrop expects (e, targetFactoryId, targetBuildingId, targetFloorId, targetLineId)
                        targetFactory?.id ?? "",
                        targetBuilding?.id ?? "",
                        targetFloor?.id ?? "",
                        line.id,
                    )}
                >
                    <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <div>
                        <CardTitle className="text-xl font-semibold">{line.name}</CardTitle>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                            <Play className="h-4 w-4 text-green-600" />
                            <span>{t("layouts.run")}: {line?.operationalTime.runningTime?.toFixed(0) || 0}p</span>
                            </div>
                            <div className="flex items-center space-x-1">
                            <Pause className="h-4 w-4 text-blue-600" />
                            <span>{t("layouts.stop")}: {lineStats?.downtime || 0} {t("building.devicesLabel")}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span>{t("devices.error")}: {line?.operationalTime.errorTime?.toFixed(0) || 0}p</span>
                            </div>
                            <div className="flex items-center space-x-1">
                            <Zap className="h-4 w-4 text-orange-600" />
                            <span>{t("layouts.power")}: {line?.power?.toFixed(1) || 0} kWh</span>
                            </div>
                        </div>
                        </div>
                        <div className="flex mt-2 gap-2 self-end sm:self-auto">
                        <Button variant="ghost" size="sm" onClick={() => handleLineDetails(line.id)}>
                            <Activity className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                            setSelectedLineId(line.id);
                            setCurrentLevel("device");
                            }}
                        >
                            <Users className="h-4 w-4" />
                        </Button>
                        <PermissionGuard permission="layout.edit">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(line.id, line.name, "dây chuyền")}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                        </PermissionGuard>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent>
                    {/* Individual Device Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {lineDevices.map((device: Device) => {
                        // const devicePower =
                        //     device.status === "Online" ? device.ratedPower * (0.7 + Math.random() * 0.3) : 0;
                        // const operationalTime = calculateOperationalTime(device);

                        return (
                            <div
                            key={device.id}
                            draggable={authService.hasPermission("layout.edit")}
                            onDragStart={(e) => handleDragStart(e, device)}
                            onDragEnd={(e) => {
                                e.stopPropagation();
                                e.currentTarget.classList.remove("opacity-50", "scale-95");
                            }}
                            className={`p-3 border rounded-lg ${authService.hasPermission("layout.edit") ? "cursor-move" : "cursor-default"} hover:shadow-md transition-all duration-200 bg-gradient-to-br from-white to-blue-50 select-none border-l-4 border-l-blue-500`}
                            >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm truncate">{device.name}</span>
                                <Badge
                                variant={device.status === "Online" ? "default" : "secondary"}
                                className={
                                    device.status === "Online"
                                    ? "bg-gradient-to-r from-green-500 to-green-600 text-white border-0"
                                    : device.status === "Error"
                                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-0"
                                        : device.status === "Maintenance"
                                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0"
                                        : "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0"
                                }
                                >
                                {device.status === "Online"
                                    ? `${t("layouts.run")}`
                                    : device.status === "Error"
                                    ? `${t("devices.error")}`
                                    : device.status === "Maintenance"
                                        ? `${t("layouts.maintenance")}`
                                        : `${t("layouts.stop")}`}
                                </Badge>
                            </div>

                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("detail.power")}:</span>
                                <span className="font-medium">{device.power?.toFixed(2)} kW</span>
                                </div>
                                <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("layouts.runningtime")}:</span>
                                <span className="font-medium text-green-600">
                                    {device.operationalTime?.runningTime.toFixed(0)}p
                                </span>
                                </div>
                                <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("layouts.deviceDownTime")}:</span>
                                <span className="font-medium text-blue-600">
                                    {device.operationalTime?.breakTime.toFixed(0)}p
                                </span>
                                </div>
                                <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("layouts.errortime")}:</span>
                                <span className="font-medium text-red-600">
                                    {device.operationalTime?.errorTime.toFixed(0)}p
                                </span>
                                </div>
                                <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("layouts.energyPerDay")}:</span>
                                <span className="font-medium">{((device.power ?? 0) * 24).toFixed(1)} {t("units.kwh")}</span>
                                </div>
                            </div>

                            <Separator className="my-2" />

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">{device.type}</span>
                                <div className="flex gap-1">
                                    <PermissionGuard permission="layout.edit"
                                    fallback={
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 cursor-not-allowed opacity-50"
                                        >
                                            <Move className="h-3 w-3" />
                                        </Button>
                                    }
                                    >
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeviceMove(device);
                                            }}
                                        >
                                            <Move className="h-3 w-3" />
                                        </Button>
                                    </PermissionGuard>
                                </div>
                            </div>
                            </div>
                        );
                        })}

                        {/* Empty slot indicator when dragging */}
                        {draggedDevice && (
                        <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                            {t("layouts.dropHere")}
                        </div>
                        )}
                    </div>

                    {lineDevices.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                        <p>{t("layouts.noDevice")}</p>
                        <p className="text-sm">{t("layouts.dragDevice")}</p>
                        </div>
                    )}
                    </CardContent>
                </Card>
                );
            })
            )}          
            </div>
        </div>

        {/* External Devices Panel */}
        <div className="w-full md:w-80">
        <Card className="sticky top-6">
            <CardHeader>
            <CardTitle className="text-lg">{t("layouts.externalDevices")}</CardTitle>
            <p className="text-sm text-muted-foreground">
                {t("layouts.externalDevicesDescription")}
            </p>
            {/* Search input for external devices */}
            <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                placeholder={`${t("common.search")}`}
                value={externalDeviceSearchTerm}
                onChange={(e) => setExternalDeviceSearchTerm(e.target.value)}
                className="pl-10"
                />
                <X className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 cursor-pointer ${externalDeviceSearchTerm ? "visible" : "invisible"}`} onClick={() => setExternalDeviceSearchTerm("")} />
            </div>
            </CardHeader>
            <CardContent>
            <ScrollArea className="h-96">
                <div className="space-y-2">
                {externalDevices
                    .filter((device) => 
                    device.name.toLowerCase().includes(externalDeviceSearchTerm.toLowerCase())
                    )
                    .map((device) => {
                    // // Get factory info from API instead of using simplified text
                    // const deviceFactory = apiFactories.find((f) => f.id === device.factoryId)
                    // const deviceBuilding = apiBuildings.find((b) => b.id === device.buildingId)
                    // const deviceFloor = apiFloors.find((f) => f.id === device.floorId)
                    // const deviceLine = apiLines.find((l) => l.id === device.lineId)
                    const devicePower = device.status === "Online" ? device.ratedPower * (0.7 + Math.random() * 0.3) : 0

                    return (
                    <div
                        key={device.id}
                        draggable={authService.hasPermission("layout.edit")}
                        onDragStart={(e) => handleDragStart(e, device)}
                        onDragEnd={(e) => {
                        e.currentTarget.classList.remove("opacity-50", "scale-95")
                        }}
                        className={`p-3 border rounded ${authService.hasPermission("layout.edit") ? "cursor-move" : "cursor-default"} hover:bg-gray-50 transition-all duration-200 select-none`}
                    >
                        <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">{device.name}</span>
                        <Badge variant={device.status === "Online" ? "default" : "secondary"}>
                            {device.status === "Online"
                            ? `${t("layouts.run")}`
                            : device.status === "Error"
                                ? `${t("devices.error")}`
                                : device.status === "Maintenance"
                                ? `${t("layouts.maintenance")}`
                                : `${t("layouts.stop")}`}
                        </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground mb-2">
                        {/* {deviceFactory?.name || 'Unknown Factory'} → {deviceBuilding?.name || 'Unknown Building'} → {deviceFloor?.name || 'Unknown Floor'} → {deviceLine?.name || 'Unknown Line'} */}
                        {getLocationString(device)}
                        </div>

                        <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("detail.power")}:</span>
                            <span className="font-medium">{devicePower.toFixed(2)} kW</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("alerts.type")}:</span>
                            <span className="font-medium">{device.type}</span>
                        </div>
                        </div>

                        <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">
                            {t("devices.ratedPower")} : {device.ratedPower.toFixed(2)} kW
                        </span>
                        <PermissionGuard permission="layout.edit"
                        fallback={
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 cursor-not-allowed opacity-50"
                            >
                                <Move className="h-3 w-3" />
                            </Button>
                        }>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                e.stopPropagation()
                                handleDeviceMove(device)
                                }}
                            >
                                <Move className="h-3 w-3" />
                            </Button>
                        </PermissionGuard>
                        </div>
                    </div>
                    )
                })}

                {externalDevices.filter((device) => 
                    device.name.toLowerCase().includes(externalDeviceSearchTerm.toLowerCase())
                ).length === 0 && externalDevices.length > 0 && externalDeviceSearchTerm && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                    {t("layouts.noDevice")} "{externalDeviceSearchTerm}"
                    </div>
                )}

                {externalDevices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                    {t("layouts.allDevicesPlaced")}
                    </div>
                )}
                </div>
            </ScrollArea>
            </CardContent>
        </Card>
        </div>
    </div>
    )
}

const renderDeviceView = () => {
    const lineDevices = filterDevicesByAccess(apiDevices).filter((d) => d.lineId === selectedLineId) // Use apiDevices instead of devices
    const filteredDevices = lineDevices.filter((device) => device.name.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredDevices.map((device) => {

        return (
            <Card key={device.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
                <Badge variant={device.status === "Online" ? "default" : "secondary"}>
                    {device.status === "Online"
                    ? `${t("layouts.run")}`
                    : device.status === "Error"
                        ? `${t("devices.error")}`
                        : device.status === "Maintenance"
                        ? `${t("layouts.maintenance")}`
                        : `${t("layouts.stop")}`}
                </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("layouts.runningtime")}</span>
                    <span className="font-medium">
                    {device.operationalTime?.runningTime.toFixed(0)} {t("layouts.minutes")}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("layouts.runningtime")}</span>
                    <span className="font-medium">
                    {device.operationalTime?.breakTime.toFixed(0)} {t("layouts.minutes")}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("layouts.errortime")}</span>
                    <span className="font-medium">
                    {device.operationalTime?.errorTime.toFixed(0)} {t("layouts.minutes")}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("detail.power")}</span>
                    <span className="font-medium">
                    {device.power?.toFixed(2) || 0}{t("units.kw")}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("layouts.energyPerDay")}</span>
                    <span className="font-medium">
                    {((device.power ?? 0) * 24).toFixed(1)} {t("units.kwh")}
                    </span>
                </div>
                <Separator />
                <PermissionGuard permission="layout.edit"
                fallback={
                    <div className="text-center text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                        {t("common.noPermissionToEdit")}
                    </div>
                }>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => handleDeviceMove(device)}
                    >
                        <Move className="h-4 w-4 mr-2" />
                        {t("devices.moveDevice")}
                    </Button>
                </PermissionGuard>
                </div>
            </CardContent>
            </Card>
        )
        })}
    </div>
    )
}

const getBreadcrumb = () => {
    const items = []

    // Factory name
    if (currentLevel !== "factory") {
    const factory = apiFactories.find((f) => f.id === selectedFactoryId)
    if (factory) {
        items.push({
        name: factory.name,
        onClick: () => {
            setCurrentLevel("factory")
            setSelectedFactoryId(null)
            setSelectedBuildingId(null)
            setSelectedFloorId(null)
            setSelectedLineId(null)
        }
        })
    }
    }

    // Building name
    if (currentLevel === "floor" || currentLevel === "line" || currentLevel === "device") {
    const building = apiBuildings.find((b) => b.id === selectedBuildingId)
    if (building) {
        items.push({
        name: building.name,
        onClick: () => {
            setCurrentLevel("building")
            setSelectedBuildingId(null)
            setSelectedFloorId(null)
            setSelectedLineId(null)
        }
        })
    }
    }

    // Floor name
    if (currentLevel === "line" || currentLevel === "device") {
    const floor = apiFloors.find((f) => f.id === selectedFloorId)
    if (floor) {
        items.push({
        name: floor.name,
        onClick: () => {
            setCurrentLevel("floor")
            setSelectedFloorId(null)
            setSelectedLineId(null)
        }
        })
    }
    }

    // Line name
    if (currentLevel === "device") {
    const line = apiLines.find((l) => l.id === selectedLineId)
    if (line) {
        items.push({
        name: line.name,
        onClick: () => {
            setCurrentLevel("line")
            setSelectedLineId(null)
        }
        })
    }
    }

    return items
}

const getLocationString = (device: Device) => {
    // Use API factories if available, fallback to store factories
    const factoriesSource = apiFactories.length > 0 ? apiFactories : []
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
const getAvailableBuildings = () => {
    // Use only API data now - return buildings that match the factory and user has access to
    return filterBuildingsByAccess(apiBuildings).filter(b => b.factoryId === selectedFactoryId)
}

const getAvailableFloors = () => {
    // Use only API data now - return floors that match the building and user has access to
    return filterFloorsByAccess(apiFloors).filter(f => f.buildingId === selectedBuildingId)
}

const getAvailableLines = () => {
    // Use only API data now - return lines that match the floor and user has access to
    return filterLinesByAccess(apiLines).filter(l => l.floorId === selectedFloorId)
}

return (
    <MainLayout>
    <div className="space-y-6 min-h-screen p-2 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                {currentLevel !== "factory" && (
                    <Button variant="outline" size="sm" onClick={handleBack} className="self-start sm:self-auto">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t("common.back")}
                    </Button>
                )}
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {t("layouts.title")}
                    </h1>
                    {getBreadcrumb().length > 0 && (
                    <div className="flex items-center space-x-2 text-gray-600">
                        {getBreadcrumb().map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <button
                            onClick={item.onClick}
                            className="hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                            >
                            {item.name}
                            </button>
                            {index < getBreadcrumb().length - 1 && (
                            <span className="text-gray-400">/</span>
                            )}
                        </div>
                        ))}
                    </div>
                    )}
                </div>
            </div>

        {/* Add Buttons */}
        <PermissionGuard
            permission="layout.create"
        >
            <div className="flex items-center gap-2">
                {currentLevel === "factory" && (
                <Button onClick={() => setIsAddFactoryOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("layouts.addFactory")}
                </Button>
                )}
                {currentLevel === "building" && (
                <Button onClick={() => setIsAddBuildingOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("layouts.addBuilding")}
                </Button>
                )}
                {currentLevel === "floor" && (
                <Button onClick={() => setIsAddFloorOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("layouts.addFloor")}
                </Button>
                )}
                {currentLevel === "line" && (
                <Button onClick={() => setIsAddLineOpen(true)} className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("layouts.addLine")}
                </Button>
                )}
            </div>
        </PermissionGuard>
        </div>
                {/* Search */}
        <Card>
        <CardContent className="pt-6">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
                placeholder={`${t("layouts.search")} ${
                currentLevel === "factory"
                    ? `${t("layouts.factory").toLowerCase()}`
                    : currentLevel === "building"
                    ? `${t("layouts.building").toLowerCase()}`
                    : currentLevel === "floor"
                        ? `${t("layouts.floor").toLowerCase()}`
                        : currentLevel === "line"
                        ? `${t("layouts.line").toLowerCase()}`
                        : `${t("layouts.devices").toLowerCase()}`
                }...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
            />
            </div>
        </CardContent>
        </Card>

        {/* Content */}
        {currentLevel === "factory" && renderFactoryView()}
        {currentLevel === "building" && renderBuildingView()}
        {currentLevel === "floor" && renderFloorView()}
        {currentLevel === "line" && renderLineView()}
        {currentLevel === "device" && renderDeviceView()}

        {/* Line Details Sheet */}
        <Sheet open={isLineDetailsOpen} onOpenChange={setIsLineDetailsOpen}>
        <SheetContent side="right" className="w-[800px] overflow-y-auto">
            <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t("common.detail")} {selectedLineDetails?.name}
            </SheetTitle>
            <SheetDescription>
                {t("layouts.inFactory")}.
            </SheetDescription>
            </SheetHeader>

            {selectedLineDetails && (
            <div className="mt-6 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-white/80">{t("dashboard.totalPower")}</p>
                        <p className="text-2xl font-bold">{selectedLineDetails.totalPower.toFixed(2)} kW</p>
                        </div>
                        <Zap className="h-8 w-8 text-white/80" />
                    </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-white/80">{t("layouts.efficiency")}</p>
                        <p className="text-2xl font-bold">{selectedLineDetails.efficiency.toFixed(1)}%</p>
                        </div>
                        <Activity className="h-8 w-8 text-white/80" />
                    </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-white/80">{t("layouts.runningtime")}</p>
                        <p className="text-2xl font-bold">{selectedLineDetails.runningTime.toFixed(0)} phút</p>
                        </div>
                        <Play className="h-8 w-8 text-white/80" />
                    </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                    <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-sm text-white/80">{t("nav.alerts")}</p>
                        <p className="text-2xl font-bold">{selectedLineDetails.alerts}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-white/80" />
                    </div>
                    </CardContent>
                </Card>
                </div>

                {/* Power Trend Chart */}
                <Card>
                <CardHeader>
                    <CardTitle>{t("analytics.powerConsumptionTrend")} (24h)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-end justify-between space-x-1">
                    {selectedLineDetails.powerTrend.map((data, index) => {
                        const maxPower = Math.max(...selectedLineDetails.powerTrend.map((d) => d.power))
                        const height = (data.power / maxPower) * 100

                        return (
                        <div
                            key={index}
                            className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t flex-1 min-h-[4px] hover:from-blue-600 hover:to-blue-500 transition-all duration-200 cursor-pointer relative group"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${data.time}: ${data.power.toFixed(2)} kW`}
                        >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {data.power.toFixed(1)} kW
                            </div>
                        </div>
                        )
                    })}
                    </div>
                </CardContent>
                </Card>

                {/* Device List */}
                <Card>
                <CardHeader>
                    <CardTitle>{t("devices")} ({selectedLineDetails.devices.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-64">
                    <div className="space-y-2">
                        {selectedLineDetails.devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                            <Badge variant={device.status === "Online" ? "default" : "secondary"}>
                                {device.status === "Online"
                                ? `${t("layouts.run")}`
                                : device.status === "Error"
                                    ? `${t("devices.error")}`
                                    : device.status === "Maintenance"
                                    ? `${t("layouts.maintenance")}`
                                    : `${t("layouts.stop")}`}
                            </Badge>
                            <div>
                                <p className="font-medium">{device.name}</p>
                                <p className="text-sm text-muted-foreground">{device.type}</p>
                            </div>
                            </div>
                            <div className="text-right">
                            <p className="font-medium">
                                {device.status === "Online"
                                ? (device.ratedPower * (0.7 + Math.random() * 0.3)).toFixed(2)
                                : "0.00"}{" "}
                                kW
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t("devices.ratedPower")} : {device.ratedPower.toFixed(2)} kW
                            </p>
                            </div>
                        </div>
                        ))}
                    </div>
                    </ScrollArea>
                </CardContent>
                </Card>
            </div>
            )}
        </SheetContent>
        </Sheet>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-sm">
            <DialogHeader>
            <DialogTitle>{t("common.edit")} {editingItem?.type}</DialogTitle>
            <DialogDescription>{t("common.updateName")} {editingItem?.type}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="editName">{t("common.name")}</Label>
                <Input
                id="editName"
                value={editingItem?.name || ""}
                onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
            </div>
            </div>
            <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t("common.cancel")}
            </Button>
            <Button onClick={() => [setIsEditDialogOpen(false), handleSave()]}>{t("common.save")}</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>

        {/* Device Relocation Dialog */}
        <Dialog open={isDeviceRelocationOpen} onOpenChange={setIsDeviceRelocationOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle>{t("devices.moveDevice")}</DialogTitle>
            <DialogDescription>{t("devices.moveDevice")} {selectedDeviceForMove?.name} {t("devices.toAnotherLocation")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label>{t("layouts.factory")}</Label>
                <Select
                    value={targetLocation.factoryId}
                    onValueChange={(value) =>
                    setTargetLocation({
                        factoryId: value,
                        buildingId: "",
                        floorId: "",
                        lineId: "",
                    })
                    }
                >
                    <SelectTrigger>
                    <SelectValue placeholder={t("layouts.selectFactory")} />
                    </SelectTrigger>
                    <SelectContent>
                    {apiFactories.map((factory) => (
                        <SelectItem key={factory.id} value={factory.id}>
                        {factory.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>

                <div className="space-y-2">
                <Label>{t("layouts.building")}</Label>
                <Select
                    value={targetLocation.buildingId}
                    onValueChange={(value) =>
                    setTargetLocation({
                        ...targetLocation,
                        buildingId: value,
                        floorId: "",
                        lineId: "",
                    })
                    }
                    disabled={!targetLocation.factoryId}
                >
                    <SelectTrigger>
                    <SelectValue placeholder={t("layouts.selectBuilding")} />
                    </SelectTrigger>
                    <SelectContent>
                    {apiBuildings
                    .filter((b) => b.factoryId === targetLocation.factoryId)
                    .map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                        {building.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>

                <div className="space-y-2">
                <Label>{t("layouts.floor")}</Label>
                <Select
                    value={targetLocation.floorId}
                    onValueChange={(value) =>
                    setTargetLocation({
                        ...targetLocation,
                        floorId: value,
                        lineId: "",
                    })
                    }
                    disabled={!targetLocation.buildingId}
                >
                    <SelectTrigger>
                    <SelectValue placeholder={t("layouts.selectFloor")} />
                    </SelectTrigger>
                    <SelectContent>
                    {apiFloors
                    .filter((f) => f.buildingId === targetLocation.buildingId)
                    .map((floor) => (
                        <SelectItem key={floor.id} value={floor.id}>
                        {floor.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>

                <div className="space-y-2">
                <Label>{t("layouts.line")}</Label>
                <Select
                    value={targetLocation.lineId}
                    onValueChange={(value) =>
                    setTargetLocation({
                        ...targetLocation,
                        lineId: value,
                    })
                    }
                    disabled={!targetLocation.floorId}
                >
                    <SelectTrigger>
                    <SelectValue placeholder={t("layouts.selectLine")} />
                    </SelectTrigger>
                    <SelectContent>
                    {apiLines
                    .filter((l) => l.floorId === targetLocation.floorId)
                    .map((line) => (
                        <SelectItem key={line.id} value={line.id}>
                        {line.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                </div>
            </div>
            </div>
            <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeviceRelocationOpen(false)}>
                {t("common.cancel")}
            </Button>
            <Button onClick={confirmDeviceMove} disabled={!targetLocation.lineId}>
                {t("devices.moveDevice")}
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    </div>

    {/* Add Factory Dialog */}
    <Dialog open={isAddFactoryOpen} onOpenChange={setIsAddFactoryOpen}>
        <DialogContent className="max-w-sm">
        <DialogHeader>
            <DialogTitle>{t("factories.addNew")}</DialogTitle>
            <DialogDescription>
            {t("factories.enterInfo")}
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="factory-name">{t("factories.name")}</Label>
                <Input
                    id="factory-name"
                    value={newFactoryName}
                    onChange={(e) => setNewFactoryName(e.target.value)}
                    placeholder={t("factories.namePlaceholder")}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="factory-location">{t("factories.location")}</Label>
                <Input
                    id="factory-location"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder={t("factories.locationPlaceholder")}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="timezone">{t("factories.timezone")}</Label>
                <TimezoneCombobox
                    value={newTimezone}
                    onValueChange={(value) => setNewTimezone(value)}
                    placeholder={t("factories.timezonePlaceholder")}
                />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFactoryOpen(false)}>
            {t("common.cancel")}
            </Button>
            <Button onClick={handleAddFactory} disabled={!newFactoryName.trim()}>
            {t("factories.addNew")}
            </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Add Building Dialog */}
    <Dialog open={isAddBuildingOpen} onOpenChange={setIsAddBuildingOpen}>
        <DialogContent className="max-w-sm">
        <DialogHeader>
            <DialogTitle>{t("buildings.addNew")}</DialogTitle>
            <DialogDescription>
            {t("buildings.enterInfo")}
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="building-name">{t("buildings.name")}</Label>
            <Input
                id="building-name"
                value={newBuildingName}
                onChange={(e) => setNewBuildingName(e.target.value)}
                placeholder={t("buildings.namePlaceholder")}
            />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddBuildingOpen(false)}>
            {t("common.cancel")}
            </Button>
            <Button onClick={handleAddBuilding} disabled={!newBuildingName.trim()}>
            {t("buildings.addNew")}
            </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Add Floor Dialog */}
    <Dialog open={isAddFloorOpen} onOpenChange={setIsAddFloorOpen}>
        <DialogContent className="max-w-sm">
        <DialogHeader>
            <DialogTitle>{t("floors.addNew")}</DialogTitle>
            <DialogDescription>
            {t("floors.enterInfo")}
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="floor-name">{t("floors.name")}</Label>
            <Input
                id="floor-name"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder={t("floors.namePlaceholder")}
            />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFloorOpen(false)}>
            {t("common.cancel")}
            </Button>
            <Button onClick={handleAddFloor} disabled={!newFloorName.trim()}>
            {t("floors.addNew")}
            </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>

    {/* Add Line Dialog */}
    <Dialog open={isAddLineOpen} onOpenChange={setIsAddLineOpen}>
        <DialogContent className="max-w-sm">
        <DialogHeader>
            <DialogTitle>{t("lines.addNew")}</DialogTitle>
            <DialogDescription>
            {t("lines.enterInfo")}
            </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="line-name">{t("lines.name")}</Label>
            <Input
                id="line-name"
                value={newLineName}
                onChange={(e) => setNewLineName(e.target.value)}
                placeholder={t("lines.namePlaceholder")}
            />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLineOpen(false)}>
            {t("common.cancel")}
            </Button>
            <Button onClick={handleAddLine} disabled={!newLineName.trim()}>
            {t("lines.addNew")}
            </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>
    </MainLayout>
)
}