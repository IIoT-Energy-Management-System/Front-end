import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/lib/i18n"
import {
    AlertCircle,
    Info,
    Settings,
    Wifi
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
  deviceId: string
  mode: "add" | "edit"
  connection?: any // Connection object for edit mode
  onSave: (connectionData: any) => Promise<void>
}

type ConnectionType = "MQTT" | "OPC_UA" | "MODBUS_TCP" | "MODBUS_RTU" | "SIMULATION"

interface ConnectionFormData {
  deviceId: string
  type: ConnectionType
  config: any
  priority: number
  isActive: boolean
  healthStatus: "Connected" | "Disconnected" | "Error"
}

export default function ConnectionModal({
  isOpen,
  onClose,
  deviceId,
  mode,
  connection,
  onSave,
}: ConnectionModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ConnectionFormData>({
    deviceId,
    type: "MQTT",
    config: {},
    priority: 1,
    isActive: true,
    healthStatus: "Disconnected"
  })

  // Reset form when modal opens or mode/connection changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && connection) {
        // Load existing connection data
        let parsedConfig = {}
        try {
          // Check if config is already an object or needs parsing
          if (typeof connection.config === 'string') {
            parsedConfig = connection.config ? JSON.parse(connection.config) : {}
          } else if (typeof connection.config === 'object' && connection.config !== null) {
            parsedConfig = connection.config
          }
        } catch (error) {
          console.warn('Error parsing connection config:', error)
        }
        
        setFormData({
          deviceId,
          type: connection.type,
          config: parsedConfig,
          priority: connection.priority || 1,
          isActive: connection.isActive || false,
          healthStatus: connection.healthStatus || "Disconnected"
        })
      } else {
        // Reset for add mode
        setFormData({
          deviceId,
          type: "MQTT",
          config: getDefaultConfig("MQTT"),
          priority: 1,
          isActive: true,
          healthStatus: "Disconnected"
        })
      }
    }
  }, [isOpen, deviceId, mode, connection])

  const getDefaultConfig = (type: ConnectionType) => {
    switch (type) {
      case "MQTT":
        return {
          broker: "mqtt://localhost",
          topic: `/device/${deviceId}`,
          port: 1883
        }
      case "OPC_UA":
        return {
          endpoint: "opc.tcp://localhost:4840",
          nodeId: `ns=2;s=${deviceId}`
        }
      case "MODBUS_TCP":
        return {
          ip: "192.168.1.100",
          port: 502,
          register: 40001
        }
      case "MODBUS_RTU":
        return {
          port: "COM1",
          baudRate: 9600,
          register: 40001
        }
      case "SIMULATION":
        return {
          interval: 5000,
          dataType: "random"
        }
      default:
        return {}
    }
  }

  const handleTypeChange = (newType: ConnectionType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      config: getDefaultConfig(newType)
    }))
  }

  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const connectionData = {
        ...formData,
        ...(mode === "edit" && connection ? { id: connection.id } : {})
      }
      await onSave(connectionData)
      toast.success(mode === "edit" ? `${t("devices.connection")} "${formData.type}" ${t("devices.updateSuccess")}!` : `${t("devices.connection")} "${formData.type}" ${t("devices.addSuccess")}!`)
      onClose()
    } catch (error) {
      console.error("Failed to save connection:", error)
      toast.error("Failed to save connection. Please try again.", {
        description: (error as any).error || (error as any).message,
      })
    } finally {
      setLoading(false)
    }
  }

  const getConnectionDescription = (type: ConnectionType) => {
    const descriptions = {
      MQTT: `${t("devices.mqttDescription")}`,
      OPC_UA: `${t("devices.opcuaDescription")}`,
      MODBUS_TCP: `${t("devices.modbusDescription")}`,
      MODBUS_RTU: "Modbus RTU - Serial communication protocol for industrial devices",
      SIMULATION: "Simulation mode - Generate mock data for testing and development"
    }
    return descriptions[type]
  }

  const renderConfigFields = () => {
    switch (formData.type) {
      case "MQTT":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broker">Broker URL</Label>
              <Input
                id="broker"
                value={formData.config.broker || ""}
                onChange={(e) => handleConfigChange("broker", e.target.value)}
                placeholder="mqtt://localhost"
                className="border-2 border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={formData.config.topic || ""}
                onChange={(e) => handleConfigChange("topic", e.target.value)}
                placeholder="/device/D001"
                className="border-2 border-blue-200 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.config.port || ""}
                onChange={(e) => handleConfigChange("port", parseInt(e.target.value) || 1883)}
                placeholder="1883"
                className="border-2 border-blue-200 focus:border-blue-400"
              />
            </div>
          </div>
        )

      case "OPC_UA":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={formData.config.endpoint || ""}
                onChange={(e) => handleConfigChange("endpoint", e.target.value)}
                placeholder="opc.tcp://localhost:4840"
                className="border-2 border-purple-200 focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nodeId">Node ID</Label>
              <Input
                id="nodeId"
                value={formData.config.nodeId || ""}
                onChange={(e) => handleConfigChange("nodeId", e.target.value)}
                placeholder="ns=2;s=Device001"
                className="border-2 border-purple-200 focus:border-purple-400"
              />
            </div>
          </div>
        )

      case "MODBUS_TCP":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                value={formData.config.ip || ""}
                onChange={(e) => handleConfigChange("ip", e.target.value)}
                placeholder="192.168.1.100"
                className="border-2 border-green-200 focus:border-green-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.config.port || ""}
                onChange={(e) => handleConfigChange("port", parseInt(e.target.value) || 502)}
                placeholder="502"
                className="border-2 border-green-200 focus:border-green-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register">Register Address</Label>
              <Input
                id="register"
                type="number"
                value={formData.config.register || ""}
                onChange={(e) => handleConfigChange("register", parseInt(e.target.value) || 40001)}
                placeholder="40001"
                className="border-2 border-green-200 focus:border-green-400"
              />
            </div>
          </div>
        )

      case "MODBUS_RTU":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="port">Serial Port</Label>
              <Input
                id="port"
                value={formData.config.port || ""}
                onChange={(e) => handleConfigChange("port", e.target.value)}
                placeholder="COM1"
                className="border-2 border-orange-200 focus:border-orange-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baudRate">Baud Rate</Label>
              <Select
                value={formData.config.baudRate?.toString() || "9600"}
                onValueChange={(value) => handleConfigChange("baudRate", parseInt(value))}
              >
                <SelectTrigger className="border-2 border-orange-200 focus:border-orange-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1200">1200</SelectItem>
                  <SelectItem value="2400">2400</SelectItem>
                  <SelectItem value="4800">4800</SelectItem>
                  <SelectItem value="9600">9600</SelectItem>
                  <SelectItem value="19200">19200</SelectItem>
                  <SelectItem value="38400">38400</SelectItem>
                  <SelectItem value="57600">57600</SelectItem>
                  <SelectItem value="115200">115200</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="register">Register Address</Label>
              <Input
                id="register"
                type="number"
                value={formData.config.register || ""}
                onChange={(e) => handleConfigChange("register", parseInt(e.target.value) || 40001)}
                placeholder="40001"
                className="border-2 border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>
        )

      case "SIMULATION":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interval">Update Interval (ms)</Label>
              <Input
                id="interval"
                type="number"
                value={formData.config.interval || ""}
                onChange={(e) => handleConfigChange("interval", parseInt(e.target.value) || 5000)}
                placeholder="5000"
                className="border-2 border-gray-200 focus:border-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataType">Data Type</Label>
              <Select
                value={formData.config.dataType || "random"}
                onValueChange={(value) => handleConfigChange("dataType", value)}
              >
                <SelectTrigger className="border-2 border-gray-200 focus:border-gray-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random Values</SelectItem>
                  <SelectItem value="sine">Sine Wave</SelectItem>
                  <SelectItem value="linear">Linear Increase</SelectItem>
                  <SelectItem value="constant">Constant Values</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wifi className="h-6 w-6 text-blue-600" />
            {mode === "edit" ? `${t("devices.editDeviceConnection")}` : `${t("devices.addDeviceConnection")}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? `${t("devices.editDeviceConnectionDescription")} ${deviceId}.`
              : `${t("devices.addDeviceConnectionDescription1")} ${deviceId} ${t("devices.addDeviceConnectionDescription2")}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connection Type Selection */}
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-blue-600" />
                {t("devices.connectionType")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connectionType">{t("devices.connectionType")}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ConnectionType) => handleTypeChange(value)}
                >
                  <SelectTrigger className="border-2 border-blue-200 focus:border-blue-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MQTT">MQTT - IoT Messaging</SelectItem>
                    <SelectItem value="OPC_UA">OPC-UA - Industrial Automation</SelectItem>
                    <SelectItem value="MODBUS_TCP">Modbus TCP - Ethernet Industrial</SelectItem>
                    <SelectItem value="MODBUS_RTU">Modbus RTU - Serial Industrial</SelectItem>
                    <SelectItem value="SIMULATION">Simulation - Testing Mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">{formData.type}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {getConnectionDescription(formData.type)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Fields */}
          <Card className="border-0 bg-gradient-to-br from-green-50 to-teal-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-green-600" />
                {t("devices.connectionConfiguration")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderConfigFields()}
            </CardContent>
          </Card>

          {/* Connection Settings */}
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-purple-600" />
                {t("common.settings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">{t("devices.connectionPriority")}</Label>
                  <Select
                    value={formData.priority.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}
                  >
                    <SelectTrigger className="border-2 border-purple-200 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - {t("common.highest")}</SelectItem>
                      <SelectItem value="2">2 - {t("common.high")}</SelectItem>
                      <SelectItem value="3">3 - {t("common.medium")}</SelectItem>
                      <SelectItem value="4">4 - {t("common.low")}</SelectItem>
                      <SelectItem value="5">5 - {t("common.lowest")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive">{t("common.active")}</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <span className="text-sm text-gray-600">
                      {formData.isActive ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-100 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">{t("common.note")}</p>
                    <p className="text-xs text-yellow-700 mt-1">{t("devices.connectionNote")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-green-600 hover:from-blue-600 hover:to-green-700"
          >
            {loading ? (mode === "edit" ? t("common.updating") : t("common.adding")) : (mode === "edit" ? t("common.updateConnection") : t("common.addConnection"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
