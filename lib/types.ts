export interface DashboardStats {
    currentPower: number
    powerTrend: number
    monthlyCost: number
    costTrend: number
    activeAlerts: number
    uptime: Array<{
        uptime: number
        runningMinutes: number
        totalMinutes: number
        shiftName: string
    }>
    buildings: Array<{
        id: string
        name: string
        power: number
        status: 'normal' | 'warning' | 'critical'
        devices: number
        warningDevices?: Array<{
            id: string
            name: string
            type: string
            factoryId: string
            buildingId: string
            floorId: string
            lineId: string
            ratedPower: number
            status: string
            createdAt: string
            lastSeen: string
        }>
    }>
    recentAlerts: Array<{
        id: string
        message: string
        time: string
        severity: 'low' | 'medium' | 'high' | 'critical'
    }>
    powerHistory: Array<{
        time: string
        value: number
    }>
}

export interface User {
    id?: string
    username: string
    email: string
    password?: string
    roleId: string
    role?: string
    permissions?: string[]
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
    id?: string
    name?: string
    type?: "Sewing Machine" | "Cutting Machine" | "Press" | "Conveyor" | "Other"
    factoryId: string
    buildingId: string
    floorId: string
    lineId: string
    ratedPower?: number
    status?: "Online" | "Offline" | "Maintenance" | "Error"
    connections?: DeviceConnection[]
    createdAt?: string
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
    offlineDeviceCount: number
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
    offlineDeviceCount: number
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
    offlineDeviceCount: number
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
    offlineDeviceCount: number
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
    severity: "Info" | "Warning" | "Critical" | "High"
    message: string
    timestamp: string
    acknowledged: boolean
    acknowledgedBy?: string
    acknowledgedAt?: string
    acknowledgmentNote?: string
    resolved: boolean
    resolvedAt?: string
}

export interface Report {
    id?: string
    name: string
    type: "Daily" | "Weekly" | "Monthly" | "Custom"
    factoryIds: string[]
    buildingIds: string[]
    floorIds: string[]
    lineIds: string[]
    deviceIds: string[]
    dateRange: { start: string; end: string }
    generatedAt?: string
    generatedBy: string
    data?: {
        summary?: {
            totalEnergyConsumption: number
            averagePowerFactor: number
            peakDemand: number
            totalCost: number
            uptimePercentage: number
        }
        devices?: {
            total: number
            topConsumers?: Array<{
                deviceId: string
                name: string
                type: string
                location: {
                    factory: string
                    building: string
                    floor: string
                    line: string
                }
                energy: number
                percentage: number
            }>
        }
        trends?: any
        timeAnalysis?: any
        anomalies?: any
        alerts?: any
        costBreakdown?: any
        recommendations?: any
        executiveSummary?: string[]
        periodInfo?: any
    }
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

// export interface RolePermissions {
//     canViewDashboard: boolean
//     canViewDevices: boolean
//     canEditDevices: boolean
//     canViewLayouts: boolean
//     canEditLayouts: boolean
//     canViewAnalytics: boolean
//     canViewReports: boolean
//     canCreateReports: boolean
//     canViewAlerts: boolean
//     canManageAlerts: boolean
//     canAccessAdmin: boolean
//     canManageUsers: boolean
//     canEditSystemSettings: boolean
//     factoryAccess: string[]
//     buildingAccess: string[]
//     floorAccess: string[]
//     lineAccess: string[]
// }

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

// export interface Role {
//   id: string
//   name: string
//   description?: string
//   permissions: RolePermissions
//   createdAt: string
//   updatedAt?: string
// }


export interface Permission {
    key: string;
    label: string;
    description: string;
    category: 'Devices' | 'Layouts' | 'Analytics' | 'Reports' | 'Alerts' | 'Admin' | 'Users' | 'Settings';
    critical?: boolean;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions?: string[];
    permissionCount?: number;
    userCount?: number;
}

export interface ApiPermission {
    key: string;
    name: string;
}

export interface SmtpConfig {
    host: string
    port: number
    username: string
    password: string
    secure: boolean
}

export interface DbConfig {
    mode: "simulation" | "mysql" | "mssql" | "postgresql"
    host?: string
    port?: number
    database?: string
    username?: string
    password?: string
}

export interface Shift {
    id?: string
    name: string
    startTime: string
    endTime: string
    order: number
}

export interface EnergyTariff {
    flatRate?: number
    timeOfUse?: Array<{
        startTime: string
        endTime: string
        rate: number
    }>
}

export interface AuditLogEntry {
    id: string
    userId: string
    username: string
    action: string
    resource?: string
    timestamp: string
    ipAddress?: string
    userAgent?: string
    details?: string
}

export interface ConnectionLogEntry {
    id: string
    deviceId: string
    deviceName: string
    connectionType: string
    status: string
    ipAddress?: string
    timestamp: string
    duration?: number
}

export interface EnergySettings {
    id: string
    type: 'flat' | 'timeOfUse'
    flatRate?: number
    timeOfUseData?: Array<{
        startTime: string
        endTime: string
        rate: number
    }>
}