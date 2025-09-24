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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBuildingApi, useDeviceApi, useFloorApi, useLineApi } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import type { Building, Device, Factory, Floor, Line } from "@/lib/types"
import {
    Activity,
    Clock,
    Edit2,
    Gauge,
    MapPin,
    Plus,
    Settings,
    Thermometer,
    Trash2,
    TrendingUp,
    Waves,
    Wifi,
    WifiOff,
    Zap
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from 'sonner'
import ConnectionModal from "./ConnectionModal"

interface DeviceModalProps {
isOpen: boolean
onClose: () => void
mode: "add" | "edit" | "view"
device?: Device | null
factories: Factory[]
onSave: (deviceData: any) => Promise<void>
language: "vi" | "en"
loading?: boolean
onDeviceUpdated?: () => void
}

export default function DeviceModal({
isOpen,
onClose,
mode,
device,
factories,
onSave,
language,
loading: externalLoading = false,
onDeviceUpdated
}: DeviceModalProps) {
const { t } = useTranslation()
const { createDeviceConnection, deleteDeviceConnection } = useDeviceApi()

const [formData, setFormData] = useState({
    name: "",
    type: "Sewing Machine" as Device["type"],
    factoryId: "",
    buildingId: "",
    floorId: "",
    lineId: "",
    ratedPower: 0.75,
    status: "Offline" as Device["status"],
})
const [loading, setLoading] = useState(false)
const [connectionModalOpen, setConnectionModalOpen] = useState(false)
const [refreshKey, setRefreshKey] = useState(0)
const [selectedFactoryId, setSelectedFactoryId] = useState<string | null>(null)
const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null)
const [selectedLineId, setSelectedLineId] = useState<string | null>(null)

// API states
const [apiBuildings, setApiBuildings] = useState<Building[]>([])
const [apiFloors, setApiFloors] = useState<Floor[]>([])
const [apiLines, setApiLines] = useState<Line[]>([])

// API hooks
const { getBuildingsByFactory } = useBuildingApi()
const { getFloorsByBuilding } = useFloorApi()
const { getLinesByFloor } = useLineApi()

// Initialize form data when modal opens or device changes
useEffect(() => {
    if (mode === "add") {
    setFormData({
        name: "",
        type: "Sewing Machine",
        factoryId: "",
        buildingId: "",
        floorId: "",
        lineId: "",
        ratedPower: 0.75,
        status: "Offline",
    })
    } else if (device && (mode === "edit" || mode === "view")) {
    setFormData({
        name: device.name,
        type: device.type,
        factoryId: device.factoryId,
        buildingId: device.buildingId,
        floorId: device.floorId,
        lineId: device.lineId,
        ratedPower: device.ratedPower,
        status: device.status,
    })
    setSelectedFactoryId(device.factoryId || null)
    setSelectedBuildingId(device.buildingId || null)
    setSelectedFloorId(device.floorId || null)
    setSelectedLineId(device.lineId || null)
    }
}, [mode, device, isOpen])

const loadDataFromApi = async (
    apiCall: () => Promise<any>,
    setState: (data: any[]) => void,
    errorMessage: string,
    setEmptyOnError: boolean = true
) => {
    try {
        setLoading(true)
        const response = await apiCall()
        setState(response)
    } catch (error) {
        console.error('Error loading data:', error)
        toast.error(errorMessage)
        if (setEmptyOnError) {
            setState([])
        }
    } finally {
        setLoading(false)
    }
}

const loadBuildingsFromApi = async (factoryId: string) => {
    await loadDataFromApi(
        () => getBuildingsByFactory(factoryId),
        setApiBuildings,
        'Không thể tải danh sách tòa nhà'
    )
}

const loadFloorsFromApi = async (buildingId: string) => {
    await loadDataFromApi(
        () => getFloorsByBuilding(buildingId),
        setApiFloors,
        'Không thể tải danh sách tầng'
    )
}

const loadLinesFromApi = async (floorId: string) => {
    await loadDataFromApi(
        () => getLinesByFloor(floorId),
        setApiLines,
        'Không thể tải danh sách dây chuyền'
    )
}

useEffect(() => {
    console.log("Selected Factory ID:", selectedFactoryId)
    if(selectedFactoryId) {
    loadBuildingsFromApi(selectedFactoryId)
    }
    if(selectedBuildingId) {
    loadFloorsFromApi(selectedBuildingId)
    }
    if(selectedFloorId) {
    loadLinesFromApi(selectedFloorId)
    }
}, [selectedFactoryId, selectedBuildingId, selectedFloorId])

const isReadOnly = mode === "view"
const isEdit = mode === "edit"
const isAdd = mode === "add"

const getModalTitle = () => {
    switch (mode) {
    case "add":
        return t("devices.addDevice") || "Add Device"
    case "edit":
        return t("devices.editDevice") || "Edit Device"
    case "view":
        return t("devices.viewDevice") || "View Device Details"
    default:
        return ""
    }
}

const getModalDescription = () => {
    switch (mode) {
    case "add":
        return t("devices.addDeviceDescription") || "Add a new device to the system"
    case "edit":
        return t("devices.editDeviceDescription") || "Edit device configuration and connection settings"
    case "view":
        return t("devices.viewDeviceDescription") || "View device details, connection status, and real-time data"
    default:
        return ""
    }
}

const handleSave = async () => {
    if (isReadOnly) return

    setLoading(true)
    console.log(formData)
    try {
        await onSave(formData)
        
        // Hiển thị toast thành công
        toast.success("Lưu thiết bị thành công!")
        
        onClose()
    } catch (error) {
        console.error("Failed to save device:", error)
        
        // Hiển thị toast lỗi
        toast.error("Lưu thiết bị thất bại. Vui lòng thử lại.", { description: (error as any).error || "Có lỗi xảy ra" })
    } finally {
        setLoading(false)
    }
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

const handleAddConnection = () => {
    if (!device?.id) {
    toast.error("Please save the device before adding connections.")
    return
    }
    setConnectionModalOpen(true)
}

const handleConnectionSave = async (connectionData: any) => {
    try {
        await createDeviceConnection(connectionData)
        setRefreshKey(prev => prev + 1)
        if (onDeviceUpdated) {
            onDeviceUpdated()
        }
        toast.success("Connection created successfully!")
    } catch (error) {
        console.error("Failed to create connection:", error)
        throw error
    }
}

const handleDeleteConnection = async (connectionId: string) => {
    if (confirm("Are you sure you want to delete this connection?")) {
    try {
        await deleteDeviceConnection(connectionId)
        setRefreshKey(prev => prev + 1)
        if (onDeviceUpdated) {
        onDeviceUpdated()
        }
        toast.success("Connection deleted successfully!")
    } catch (error) {
        console.error("Failed to delete connection:", error)
        toast.error("Failed to delete connection. Please try again.")
    }
    }
}

return (
    <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-2xl">
            {getModalTitle()}
            {mode === "view" && device && (
            <Badge className={getStatusColor(device.status)}>{device.status}</Badge>
            )}
        </DialogTitle>
        <DialogDescription className="text-gray-600">{getModalDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
        {/* Loading State */}
        {externalLoading && (
            <Card className="border-0 bg-gray-50">
            <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-6 w-6 border-2 border-purple-600 rounded-full border-t-transparent"></div>
                <span className="text-gray-600">Loading device details...</span>
                </div>
            </CardContent>
            </Card>
        )}

        {/* Device Information Section */}
        {!externalLoading && (
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-purple-600" />
                {t("devices.deviceInformation")}
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Device Name */}
                <div className="space-y-2">
                <Label htmlFor="deviceName" className="text-sm font-semibold">{t("devices.deviceName")}</Label>
                {isReadOnly ? (
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm font-medium">
                    {formData.name}
                    </div>
                ) : (
                    <Input
                    id="deviceName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("devices.deviceNamePlaceholder") || "Enter device name"}
                    className="border-2 border-purple-200 focus:border-purple-400 bg-white"
                    />
                )}
                </div>

                {/* Device Type */}
                <div className="space-y-2">
                <Label htmlFor="deviceType" className="text-sm font-semibold">{t("devices.deviceType")}</Label>
                {isReadOnly ? (
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm">
                    <Badge className={`bg-gradient-to-r ${getTypeColor(formData.type)} text-white border-0`}>
                        {formData.type}
                    </Badge>
                    </div>
                ) : (
                    <Select
                    value={formData.type}
                    onValueChange={(value: Device["type"]) => setFormData({ ...formData, type: value })}
                    >
                    <SelectTrigger className="border-2 border-purple-200 focus:border-purple-400 bg-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Sewing Machine">Sewing Machine</SelectItem>
                        <SelectItem value="Cutting Machine">Cutting Machine</SelectItem>
                        <SelectItem value="Press">Press</SelectItem>
                        <SelectItem value="Conveyor">Conveyor</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                    </Select>
                )}
                </div>

                {/* Rated Power */}
                <div className="space-y-2">
                <Label htmlFor="ratedPower" className="text-sm font-semibold">{t("devices.ratedPower")}</Label>
                {isReadOnly ? (
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm font-mono">
                    {formData.ratedPower} kW
                    </div>
                ) : (
                    <Input
                    id="ratedPower"
                    type="number"
                    step="0.01"
                    value={formData.ratedPower}
                    onChange={(e) => setFormData({ ...formData, ratedPower: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0.75"
                    className="border-2 border-purple-200 focus:border-purple-400 bg-white"
                    />
                )}
                </div>

                {/* Status (for edit/view mode) */}
                {(isEdit || isReadOnly) && (
                <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-semibold">{t("devices.status")}</Label>
                    {isReadOnly ? (
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm">
                        <Badge className={getStatusColor(formData.status)}>{formData.status}</Badge>
                    </div>
                    ) : (
                    <Select
                        value={formData.status}
                        onValueChange={(value: Device["status"]) => setFormData({ ...formData, status: value })}
                    >
                        <SelectTrigger className="border-2 border-purple-200 focus:border-purple-400 bg-white">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Offline">Offline</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Error">Error</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                </div>
                )}
            </div>
            </CardContent>
        </Card>
        )}

        {/* Location Section */}
        {!externalLoading && (
        <Card className="border-0 bg-gradient-to-br from-green-50 to-teal-50">
            <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-green-600" />
                {t("devices.locationInformation")}
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Factory */}
                <div className="space-y-2">
                <Label htmlFor="factory" className="text-sm font-semibold">{t("layouts.factory")}</Label>
                {isReadOnly ? (
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm font-medium">
                    {device?.factoryName || factories.find(f => f.id === formData.factoryId)?.name || "Unknown"}
                    </div>
                ) : (
                    <Select
                    value={formData.factoryId}
                    onValueChange={(value) => [setSelectedFactoryId(value), setFormData({ ...formData, factoryId: value, buildingId: "", floorId: "", lineId: "" })]}
                    >
                    <SelectTrigger className="border-2 border-green-200 focus:border-green-400 bg-white">
                        <SelectValue placeholder="Select factory" />
                    </SelectTrigger>
                    <SelectContent>
                        {factories.map((factory) => (
                        <SelectItem key={factory.id} value={factory.id}>
                            {factory.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                )}
                </div>

                {/* Building */}
                {formData.factoryId && (
                <div className="space-y-2">
                    <Label htmlFor="building" className="text-sm font-semibold">{t("layouts.building")}</Label>
                    {isReadOnly ? (
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm font-medium">
                        {device?.buildingName || apiBuildings?.find(b => b.id === formData.buildingId)?.name || "Unknown"}
                    </div>
                    ) : (
                    <Select
                        value={formData.buildingId}
                        onValueChange={(value) =>
                        [setSelectedBuildingId(value), setFormData({ ...formData, buildingId: value, floorId: "", lineId: "" })]
                        }
                    >
                        <SelectTrigger className="border-2 border-green-200 focus:border-green-400 bg-white">
                        <SelectValue placeholder="Select building" />
                        </SelectTrigger>
                        <SelectContent>
                        {apiBuildings.length > 0 && apiBuildings.map((building) => (
                            <SelectItem key={building.id} value={building.id}>
                                {building.name}
                            </SelectItem>
                            )) || (
                            <SelectItem value="B001">
                                Tòa nhà A
                            </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    )}
                </div>
                )}

                {/* Floor */}
                {formData.buildingId && (
                <div className="space-y-2">
                    <Label htmlFor="floor" className="text-sm font-semibold">{t("layouts.floor")}</Label>
                    {isReadOnly ? (
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm font-medium">
                        {device?.floorName || factories
                        .find(f => f.id === formData.factoryId)
                        ?.buildings?.find(b => b.id === formData.buildingId)
                        ?.floors?.find(f => f.id === formData.floorId)?.name || "Unknown"}
                    </div>
                    ) : (
                    <Select
                        value={formData.floorId}
                        onValueChange={(value) => [setSelectedFloorId(value), , setFormData({ ...formData, floorId: value, lineId: "" })]}
                    >
                        <SelectTrigger className="border-2 border-green-200 focus:border-green-400 bg-white">
                        <SelectValue placeholder="Select floor" />
                        </SelectTrigger>
                        <SelectContent>
                        {apiFloors.length > 0 && apiFloors.map((floor) => (
                            <SelectItem key={floor.id} value={floor.id}>
                                {floor.name}
                            </SelectItem>
                            )) || (
                            <SelectItem value="FL001">Tầng A</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    )}
                </div>
                )}

                {/* Line */}
                {formData.floorId && (
                <div className="space-y-2">
                    <Label htmlFor="line" className="text-sm font-semibold">{t("layouts.line")}</Label>
                    {isReadOnly ? (
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm font-medium">
                        {device?.lineName || factories
                        .find(f => f.id === formData.factoryId)
                        ?.buildings?.find(b => b.id === formData.buildingId)
                        ?.floors?.find(f => f.id === formData.floorId)
                        ?.lines?.find(l => l.id === formData.lineId)?.name || "Unknown"}
                    </div>
                    ) : (
                    <Select
                        value={formData.lineId}
                        onValueChange={(value) => setFormData({ ...formData, lineId: value })}
                    >
                        <SelectTrigger className="border-2 border-green-200 focus:border-green-400 bg-white">
                        <SelectValue placeholder="Select line" />
                        </SelectTrigger>
                        <SelectContent>
                        {apiLines.length > 0 && apiLines.map((line) => (
                            <SelectItem key={line.id} value={line.id}>
                                {line.name}
                            </SelectItem>
                            )) || (
                            <SelectItem value="L001">
                                Dây chuyền 1
                            </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    )}
                </div>
                )}
            </div>
            </CardContent>
        </Card>
        )}

        {/* Connection Configuration Section - Only for view and edit mode */}
        {(mode === "view" || mode === "edit") && device && !externalLoading && (
            <Card className="border-0 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                <Wifi className="h-5 w-5 text-orange-600" />
                Connection Configuration
                {device.connections && device.connections.length > 0 ? (
                    <Badge variant="outline" className="ml-auto text-green-600 border-green-300">
                    {device.connections.filter(c => c.isActive).length} Active
                    </Badge>
                ) : (
                    <Badge variant="outline" className="ml-auto text-gray-500 border-gray-300">
                    Not Configured
                    </Badge>
                )}
                </CardTitle>
                {mode === "edit" && (
                <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="text-orange-600 border-orange-300" onClick={handleAddConnection}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Connection
                    </Button>
                </div>
                )}
            </CardHeader>
            <CardContent>
                {device.connections && device.connections.length > 0 ? (
                <div className="space-y-3">
                    {device.connections.map((connection, index) => (
                    <div key={connection.id || index} className="bg-white rounded-lg p-4 shadow-sm border">
                        <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {connection.healthStatus === "Connected" ? (
                            <Wifi className="h-5 w-5 text-green-600" />
                            ) : (
                            <WifiOff className="h-5 w-5 text-red-600" />
                            )}
                            <div>
                            <span className="font-semibold text-lg">{connection.type}</span>
                            <div className="text-xs text-gray-500">ID: {connection.id}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={
                            connection.healthStatus === "Connected" 
                                ? "bg-green-100 text-green-800 border-green-300" 
                                : connection.healthStatus === "Disconnected"
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-yellow-100 text-yellow-800 border-yellow-300"
                            }>
                            {connection.healthStatus}
                            </Badge>
                            {mode === "edit" && (
                            <>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDeleteConnection(connection.id)}>
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
                            )}
                        </div>
                        </div>
                        
                        {/* Connection Details */}
                        <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="font-medium">Priority:</span>
                            <span>{connection.priority}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <span className={connection.isActive ? "text-green-600" : "text-gray-500"}>
                            {connection.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        {connection.lastConnected && (
                            <div className="flex justify-between">
                            <span className="font-medium">Last Connected:</span>
                            <span>{new Date(connection.lastConnected).toLocaleString()}</span>
                            </div>
                        )}
                        </div>

                        {/* Connection Config Details */}
                        {connection.config && (
                        <div className="mt-3 pt-3 border-t">
                            <div className="text-xs font-medium text-gray-600 mb-2">Configuration:</div>
                            <div className="bg-gray-50 rounded p-2 text-xs font-mono space-y-1">
                            {connection.type === "MQTT" && (
                                <>
                                <div><span className="text-gray-500">Broker:</span> {connection.config.broker || connection.config.mqtt?.broker}</div>
                                <div><span className="text-gray-500">Topic:</span> {connection.config.topic || connection.config.mqtt?.topic}</div>
                                <div><span className="text-gray-500">Port:</span> {connection.config.port || connection.config.mqtt?.port}</div>
                                </>
                            )}
                            {connection.type === "OPC_UA" && (
                                <>
                                <div><span className="text-gray-500">Endpoint:</span> {connection.config.endpoint || connection.config.opcua?.endpoint}</div>
                                <div><span className="text-gray-500">Node ID:</span> {connection.config.nodeId || connection.config.opcua?.nodeId}</div>
                                </>
                            )}
                            {connection.type === "MODBUS_TCP" && (
                                <>
                                <div><span className="text-gray-500">IP:</span> {connection.config.ip || connection.config.modbusTcp?.ip}</div>
                                <div><span className="text-gray-500">Port:</span> {connection.config.port || connection.config.modbusTcp?.port}</div>
                                <div><span className="text-gray-500">Register:</span> {connection.config.register || connection.config.modbusTcp?.register}</div>
                                </>
                            )}
                            {connection.type === "MODBUS_RTU" && (
                                <>
                                <div><span className="text-gray-500">Port:</span> {connection.config.port || connection.config.modbusRtu?.port}</div>
                                <div><span className="text-gray-500">Baud Rate:</span> {connection.config.baudRate || connection.config.modbusRtu?.baudRate}</div>
                                <div><span className="text-gray-500">Register:</span> {connection.config.register || connection.config.modbusRtu?.register}</div>
                                </>
                            )}
                            </div>
                        </div>
                        )}
                    </div>
                    ))}
                </div>
                ) : (
                <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                    <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No connections configured</p>
                    <p className="text-gray-400 text-sm mt-2">
                    Configure device connections to start receiving real-time data.
                    </p>
                    {mode === "edit" && (
                    <Button className="mt-4" variant="outline" onClick={handleAddConnection}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Connection
                    </Button>
                    )}
                </div>
                )}
            </CardContent>
            </Card>
        )}

        {/* Real-time Data Section - Only for view mode */}
        {mode === "view" && device && !externalLoading && (
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-blue-600" />
                {t("devices.realTimeData")}
                {device.latestData && (
                    <Badge variant="secondary" className="ml-auto">
                    {device.latestData.status}
                    </Badge>
                )}
                </CardTitle>
                <CardDescription>
                {device.latestData 
                    ? `${t("common.lastUpdated")}: ${new Date(device.latestData.timestamp).toLocaleString()}`
                    : `${t("common.noDataRealTime")}`
                }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {device.latestData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Power */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-600">Power</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {device.latestData.power?.toFixed(2) || '0'} kW
                    </div>
                    </div>
                    
                    {/* Voltage */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Voltage</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {device.latestData.voltage?.toFixed(1) || '0'} V
                    </div>
                    </div>
                    
                    {/* Current */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="flex items-center gap-2 mb-1">
                        <Waves className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600">Current</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {device.latestData.current?.toFixed(2) || '0'} A
                    </div>
                    </div>
                    
                    {/* Energy */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="flex items-center gap-2 mb-1">
                        <Gauge className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Energy</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {device.latestData.energy?.toFixed(2) || '0'} kWh
                    </div>
                    </div>
                    
                    {/* Frequency */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-600">Frequency</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {device.latestData.frequency?.toFixed(1) || '0'} Hz
                    </div>
                    </div>
                    
                    {/* Temperature */}
                    {device.latestData.temperature && (
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                        <div className="flex items-center gap-2 mb-1">
                        <Thermometer className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-gray-600">Temperature</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                        {device.latestData.temperature.toFixed(1)}°C
                        </div>
                    </div>
                    )}
                    
                    {/* Humidity */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-medium text-gray-600">Humidity</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {device.latestData.humidity?.toFixed(1) || '0'}%
                    </div>
                    </div>
                    
                    {/* Pressure */}
                    <div className="bg-white rounded-lg p-3 shadow-sm border">
                    <div className="flex items-center gap-2 mb-1">
                        <Gauge className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-600">Pressure</span>
                    </div>
                    <div className="text-xl font-bold text-gray-900">
                        {device.latestData.pressure?.toFixed(2) || '0'} bar
                    </div>
                    </div>
                </div>
                ) : (
                <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">{t("common.noDataRealTime")}</p>
                    <p className="text-gray-400 text-sm mt-2">
                    {t("common.deviceNeedsConfiguration")}
                    </p>
                </div>
                )}
            </CardContent>
            </Card>
        )}

        {/* System Information Section - Only for view mode */}
        {mode === "view" && device && !externalLoading && (
            <Card className="border-0 bg-gradient-to-br from-gray-50 to-slate-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-gray-600" />
                {t("common.systemInformation")}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-600">{t("devices.deviceId")}</Label>
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm font-mono text-sm">
                    {device.id}
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-600">{t("devices.createdAt")}</Label>
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm">
                    {device.createdAt ? new Date(device.createdAt).toLocaleString() : "Unknown"}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-600">{t("devices.lastSeen")}</Label>
                    <div className="px-3 py-2 border rounded-md bg-white shadow-sm">
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}
                    </div>
                </div>
                </div>
            </CardContent>
            </Card>
        )}
        </div>

        <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>
            {isReadOnly ? (t("common.close") || "Close") : (t("common.cancel") || "Cancel")}
        </Button>
        {!isReadOnly && (
            <Button
            onClick={handleSave}
            disabled={!formData.name || !formData.lineId || loading}
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
            {loading ? "Saving..." : isAdd ? (t("common.add") || "Add") : (t("common.save") || "Save")}
            </Button>
        )}
        </DialogFooter>
    </DialogContent>

    {/* Connection Modal */}
    {device?.id && (
        <ConnectionModal
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        deviceId={device.id}
        onSave={handleConnectionSave}
        language={language}
        />
    )}
    </Dialog>
)
}
