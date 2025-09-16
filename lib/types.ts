export interface DashboardStats {
    totalPower: number
    totalDevices: number
    onlineDevices: number
    activeAlerts: number
    operationalTime: {
        runningTime: number
        breakTime: number
        errorTime: number
        totalShiftTime: number
    }
    powerByBuilding: Array<{
        name: string
        power: number
        devices: number
        operationalTime: {
            runningTime: number
            breakTime: number
            errorTime: number
            totalShiftTime: number
        }
    }>
    powerTrend: Array<{ time: string; power: number; efficiency: number }>
    trendLines: Array<{
        id: string
        name: string
        data: Array<{
        time: string
        power: number
        efficiency: number
        operationalStatus: "running" | "break" | "error" | "idle"
        }>
    }>
    operationalByShift: Array<{
        name: string,
        start: string,
        end: string,
        runningMinutes: number,
        breakMinutes: number,
        errorMinutes: number,
        shiftLengthMinutes: number,
        totalMinutesReturned: number,
        runningPercentOfShift: number,
        breakPercentOfShift: number,
        errorPercentOfShift: number,
    }>
    realTimeOperationalStatus: Array<{
        deviceId: string
        deviceName: string
        status: "running" | "break" | "error" | "idle"
        runningMinutes: number
        breakMinutes: number
        errorMinutes: number
        totalMinutesReturned: number
        runningPercent: number
    }>;
}

export interface User {
    id?: string
    username: string
    email: string
    password?: string
    roleId: string
    role?: string
    factoryAccess: string[]
    buildingAccess: string[]
    floorAccess: string[]
    lineAccess: string[]
    language: "en" | "vi"
    timezone: string
    createdAt?: string
    lastLogin?: string
    isActive: boolean
}

export interface Device {
    id: string
    name: string
    type: "Sewing Machine" | "Cutting Machine" | "Press" | "Conveyor" | "Other"
    factoryId: string
    buildingId: string
    floorId: string
    lineId: string
    ratedPower: number
    status: "Online" | "Offline" | "Maintenance" | "Error"
    connections?: DeviceConnection[]
    createdAt: string
    lastSeen?: string
    factoryName?: string
    buildingName?: string
    floorName?: string
    lineName?: string
    latestData?: DeviceData
    power?: number
    operationalTime?: {
        runningTime: number
        breakTime: number
        errorTime: number
        uptimePercentage: number
    }
}

export interface DeviceConnection {
    id: string
    deviceId?: string
    type: "MQTT" | "OPC_UA" | "MODBUS_TCP" | "MODBUS_RTU" | "SIMULATION"
    config: {
        // MQTT config (flat structure as per API)
        broker?: string
        topic?: string
        port?: number
        // OPC-UA config  
        endpoint?: string
        nodeId?: string
        // Modbus TCP config
        ip?: string
        register?: number
        // Modbus RTU config
        baudRate?: number
        // Legacy nested structure support
        mqtt?: { broker: string; topic: string; port: number }
        opcua?: { endpoint: string; nodeId: string }
        modbusTcp?: { ip: string; port: number; register: number }
        modbusRtu?: { port: string; baudRate: number; register: number }
    }
    priority: number
    isActive: boolean
    lastConnected?: string
    healthStatus: "Connected" | "Disconnected" | "Error"
}

export interface DeviceData {
    timestamp: string
    power: number // kW
    voltage: number // V
    current: number // A
    status: "ON" | "OFF"
    energy: number // kWh
    frequency: number
    humidity: number
    pressure: number
    temperature?: number
}

export interface Factory {
    id: string
    name: string
    location: string
    timezone: string
    buildingCount: number
    deviceCount: number
    onlineDeviceCount: number
    buildings?: Building[]
    power: number
    operationalTime: {
        runningTime: number
        errorTime: number
        uptimePercentage: number
    }
}

export interface Building {
    id: string
    name: string
    factoryId: string
    factoryName?: string
    floors?: Floor[]
    floorCount: number
    power: number
    operationalTime: {
        runningTime: number
        errorTime: number
        uptimePercentage: number
    }
}

export interface Floor {
    id: string
    name: string
    buildingId: string
    buildingName?: string
    lines?: Line[]
    lineCount: number
    power: number
    operationalTime: {
        runningTime: number
        errorTime: number
        uptimePercentage: number
    }
}

export interface Line {
    id: string
    name: string
    floorId: string
    floorName?: string
    devices: Device[]
    power: number
    operationalTime: {
        runningTime: number
        errorTime: number
        uptimePercentage: number
    }
}

export interface Alert {
    id: string
    deviceId: string
    deviceName?: string
    type: "Power Threshold" | "Device Offline" | "Low Power Factor" | "Temperature" | "Custom"
    severity: "Info" | "Warning" | "Critical"
    message: string
    timestamp: string
    acknowledged: boolean
    acknowledgedBy?: string
    acknowledgedAt?: string
    resolved: boolean
    resolvedAt?: string
}

export interface Report {
    id: string
    name: string
    type: "Daily" | "Weekly" | "Monthly" | "Custom"
    factoryIds: string[]
    buildingIds: string[]
    floorIds: string[]
    lineIds: string[]
    deviceIds: string[]
    dateRange: { start: string; end: string }
    generatedAt: string
    generatedBy: string
    data: any
}

export interface SystemSettings {
    databaseMode: "simulation" | "mysql" | "mssql" | "postgresql"
    databaseConfig?: {
        host: string
        port: number
        database: string
        username: string
        password: string
    }
    smtpConfig?: {
        host: string
        port: number
        username: string
        password: string
        secure: boolean
    }
    energyTariff: {
        flatRate?: number
        timeOfUse?: Array<{
        startTime: string
        endTime: string
        rate: number
        }>
    }
    shifts: Array<{
        name: string
        startTime: string
        endTime: string
    }>
    languages: string[]
    companyLogo?: string
    companyName: string
}

export interface AuditLog {
    id: string
    userId: string
    username: string
    action: string
    resource: string
    timestamp: string
    ipAddress: string
    userAgent: string
    details?: Record<string, any>
}

export interface ConnectionLog {
    id: string
    deviceId: string
    deviceName: string
    connectionType: string
    duration: number
    status: "Connected" | "Disconnected" | "Error"
    ipAddress?: string
    timestamp: string
}

export interface RolePermissions {
    canViewDashboard: boolean
    canViewDevices: boolean
    canEditDevices: boolean
    canViewLayouts: boolean
    canEditLayouts: boolean
    canViewAnalytics: boolean
    canViewReports: boolean
    canCreateReports: boolean
    canViewAlerts: boolean
    canManageAlerts: boolean
    canAccessAdmin: boolean
    canManageUsers: boolean
    canEditSystemSettings: boolean
    factoryAccess: string[]
    buildingAccess: string[]
    floorAccess: string[]
    lineAccess: string[]
}

export interface AnalyticsData {
  totalEnergyConsumption: number
  averagePowerFactor: number
  peakDemand: number
  loadFactor: number
  uptimePercentage: number
  energyEfficiency: number
  costEstimate: number
  currentPower: number
  trendData: Array<{
    time: string
    power: number
    energy: number
    timestamp: number
  }>
  devicePerformance: Array<{
    deviceId: string
    deviceName: string
    efficiency: number
    uptime: number
    energyUsage: number
  }>
}

export interface RankingData {
  buildings: Array<{
    id: string
    name: string
    uptime: number
    downtime: number
    powerConsumption: number
    alerts: number
    efficiency: number
  }>
  floors: Array<{
    id: string
    name: string
    buildingName: string
    uptime: number
    downtime: number
    powerConsumption: number
    alerts: number
    efficiency: number
  }>
  lines: Array<{
    id: string
    name: string
    floorName: string
    uptime: number
    downtime: number
    powerConsumption: number
    alerts: number
    efficiency: number
  }>
  devices: Array<{
    id: string
    name: string
    lineName: string
    uptime: number
    downtime: number
    powerConsumption: number
    alerts: number
    efficiency: number
  }>
}

export interface ReportData {
  period: string
  powerConsumption: Array<{ date: string; value: number }>
  uptime: Array<{ date: string; value: number }>
  downtime: Array<{ date: string; value: number }>
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: RolePermissions
  createdAt: string
  updatedAt?: string
}