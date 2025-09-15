import type {
  Device,
  DeviceData,
  Factory,
  Floor,
  Line,
  User,
  Alert,
  SystemSettings,
  AuditLog,
  ConnectionLog,
} from "./types"

// Enhanced User Role Permissions
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

// Simulated database
class SimulatedDatabase {
  private factories: Factory[] = []
  private devices: Device[] = []
  private deviceData: DeviceData[] = []
  private users: User[] = []
  private alerts: Alert[] = []
  private auditLogs: AuditLog[] = []
  private connectionLogs: ConnectionLog[] = []
  private settings: SystemSettings
  private rolePermissions: Map<string, RolePermissions> = new Map()

  constructor() {
    this.initializeData()
    this.initializeRolePermissions()
    this.settings = {
      databaseMode: "simulation",
      energyTariff: { flatRate: 0.12 },
      shifts: [
        { name: "Day Shift", startTime: "06:00", endTime: "14:00" },
        { name: "Evening Shift", startTime: "14:00", endTime: "22:00" },
        { name: "Night Shift", startTime: "22:00", endTime: "06:00" },
      ],
      languages: ["en", "vi"],
      companyName: "IIoT Energy Management",
    }
  }

  private initializeRolePermissions() {
    // Admin - Full access
    this.rolePermissions.set("Admin", {
      canViewDashboard: true,
      canViewDevices: true,
      canEditDevices: true,
      canViewLayouts: true,
      canEditLayouts: true,
      canViewAnalytics: true,
      canViewReports: true,
      canCreateReports: true,
      canViewAlerts: true,
      canManageAlerts: true,
      canAccessAdmin: true,
      canManageUsers: true,
      canEditSystemSettings: true,
      factoryAccess: [],
      buildingAccess: [],
      floorAccess: [],
      lineAccess: [],
    })

    // Supervisor - Management level access
    this.rolePermissions.set("Supervisor", {
      canViewDashboard: true,
      canViewDevices: true,
      canEditDevices: true,
      canViewLayouts: true,
      canEditLayouts: true,
      canViewAnalytics: true,
      canViewReports: true,
      canCreateReports: true,
      canViewAlerts: true,
      canManageAlerts: true,
      canAccessAdmin: false,
      canManageUsers: false,
      canEditSystemSettings: false,
      factoryAccess: [],
      buildingAccess: [],
      floorAccess: [],
      lineAccess: [],
    })

    // Operator - Operational access
    this.rolePermissions.set("Operator", {
      canViewDashboard: true,
      canViewDevices: true,
      canEditDevices: false,
      canViewLayouts: true,
      canEditLayouts: false,
      canViewAnalytics: true,
      canViewReports: true,
      canCreateReports: false,
      canViewAlerts: true,
      canManageAlerts: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canEditSystemSettings: false,
      factoryAccess: [],
      buildingAccess: [],
      floorAccess: [],
      lineAccess: [],
    })

    // Viewer - Read-only access
    this.rolePermissions.set("Viewer", {
      canViewDashboard: true,
      canViewDevices: true,
      canEditDevices: false,
      canViewLayouts: true,
      canEditLayouts: false,
      canViewAnalytics: true,
      canViewReports: true,
      canCreateReports: false,
      canViewAlerts: true,
      canManageAlerts: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canEditSystemSettings: false,
      factoryAccess: [],
      buildingAccess: [],
      floorAccess: [],
      lineAccess: [],
    })
  }

  private initializeData() {
    // Create multiple factories
    const factory1: Factory = {
      id: "factory-1",
      name: "Main Manufacturing Plant",
      location: "Ho Chi Minh City, Vietnam",
      timezone: "Asia/Ho_Chi_Minh",
      buildings: [],
    }

    const factory2: Factory = {
      id: "factory-2",
      name: "Secondary Production Facility",
      location: "Hanoi, Vietnam",
      timezone: "Asia/Ho_Chi_Minh",
      buildings: [],
    }

    // Create multiple buildings for Factory 1
    const buildings1 = [
      {
        id: "building-1",
        name: "Production Building A",
        factoryId: "factory-1",
        floors: [] as Floor[],
        color:"red"
      },
      {
        id: "building-2",
        name: "Production Building B",
        factoryId: "factory-1",
        floors: [] as Floor[],
        color:"blue"
      },
      {
        id: "building-3",
        name: "Assembly Building",
        factoryId: "factory-1",
        floors: [] as Floor[],
        color:"green"
      },
    ]

    // Create multiple buildings for Factory 2
    const buildings2 = [
      {
        id: "building-4",
        name: "Manufacturing Hall 1",
        factoryId: "factory-2",
        floors: [] as Floor[],
      },
      {
        id: "building-5",
        name: "Manufacturing Hall 2",
        factoryId: "factory-2",
        floors: [] as Floor[],
      },
    ]

    let deviceCounter = 1

    // Create floors, lines, and devices for each building
    buildings1.forEach((building, buildingIndex) => {
      const floors: Floor[] = []

      // Create 3 floors per building
      for (let floorNum = 1; floorNum <= 3; floorNum++) {
        const floor: Floor = {
          id: `floor-${buildingIndex + 1}-${floorNum}`,
          name: `Floor ${floorNum}`,
          buildingId: building.id,
          lines: [],
        }

        // Create 4 lines per floor
        for (let lineNum = 1; lineNum <= 4; lineNum++) {
          const line: Line = {
            id: `line-${buildingIndex + 1}-${floorNum}-${lineNum}`,
            name: `${building.name.includes("Assembly") ? "Assembly" : "Sewing"} Line ${lineNum}`,
            floorId: floor.id,
            devices: [],
          }

          // Create 8-12 devices per line
          const deviceCount = 8 + Math.floor(Math.random() * 5)
          for (let deviceNum = 1; deviceNum <= deviceCount; deviceNum++) {
            const deviceType = building.name.includes("Assembly")
              ? Math.random() > 0.5
                ? "Press"
                : "Conveyor"
              : "Sewing Machine"

            const device: Device = {
              id: `device-${deviceCounter}`,
              name: `${deviceType} ${deviceCounter.toString().padStart(3, "0")}`,
              type: deviceType as Device["type"],
              factoryId: factory1.id,
              buildingId: building.id,
              floorId: floor.id,
              lineId: line.id,
              ratedPower:
                deviceType === "Sewing Machine"
                  ? 0.75 + Math.random() * 0.5
                  : deviceType === "Press"
                    ? 2.0 + Math.random() * 1.0
                    : 1.2 + Math.random() * 0.8,
              status: Math.random() > 0.15 ? "Online" : "Offline",
              connections: [
                {
                  id: `conn-${deviceCounter}`,
                  type: "SIMULATION",
                  config: {},
                  priority: 1,
                  isActive: true,
                  healthStatus: "Connected",
                },
              ],
              createdAt: new Date().toISOString(),
            }

            this.devices.push(device)
            line.devices.push(device)
            deviceCounter++
          }

          floor.lines.push(line)
        }

        floors.push(floor)
      }

      building.floors = floors
    })

    // Create floors, lines, and devices for Factory 2
    buildings2.forEach((building, buildingIndex) => {
      const floors: Floor[] = []

      // Create 2 floors per building
      for (let floorNum = 1; floorNum <= 2; floorNum++) {
        const floor: Floor = {
          id: `floor-f2-${buildingIndex + 1}-${floorNum}`,
          name: `Floor ${floorNum}`,
          buildingId: building.id,
          lines: [],
        }

        // Create 3 lines per floor
        for (let lineNum = 1; lineNum <= 3; lineNum++) {
          const line: Line = {
            id: `line-f2-${buildingIndex + 1}-${floorNum}-${lineNum}`,
            name: `Production Line ${lineNum}`,
            floorId: floor.id,
            devices: [],
          }

          // Create 6-10 devices per line
          const deviceCount = 6 + Math.floor(Math.random() * 5)
          for (let deviceNum = 1; deviceNum <= deviceCount; deviceNum++) {
            const deviceTypes = ["Cutting Machine", "Sewing Machine", "Press"]
            const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)]

            const device: Device = {
              id: `device-${deviceCounter}`,
              name: `${deviceType} ${deviceCounter.toString().padStart(3, "0")}`,
              type: deviceType as Device["type"],
              factoryId: factory2.id,
              buildingId: building.id,
              floorId: floor.id,
              lineId: line.id,
              ratedPower:
                deviceType === "Sewing Machine"
                  ? 0.75 + Math.random() * 0.5
                  : deviceType === "Cutting Machine"
                    ? 1.5 + Math.random() * 0.8
                    : 2.0 + Math.random() * 1.0,
              status: Math.random() > 0.12 ? "Online" : "Offline",
              connections: [
                {
                  id: `conn-${deviceCounter}`,
                  type: "SIMULATION",
                  config: {},
                  priority: 1,
                  isActive: true,
                  healthStatus: "Connected",
                },
              ],
              createdAt: new Date().toISOString(),
            }

            this.devices.push(device)
            line.devices.push(device)
            deviceCounter++
          }

          floor.lines.push(line)
        }

        floors.push(floor)
      }

      building.floors = floors
    })

    factory1.buildings = buildings1
    factory2.buildings = buildings2
    this.factories = [factory1, factory2]

    // Create users with different roles and permissions
    this.users = [
      {
        id: "user-1",
        username: "admin",
        email: "admin@company.com",
        role: "Admin",
        factoryAccess: ["factory-1", "factory-2"],
        buildingAccess: [],
        floorAccess: [],
        lineAccess: [],
        language: "en",
        timezone: "Asia/Ho_Chi_Minh",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "user-2",
        username: "supervisor1",
        email: "supervisor1@company.com",
        role: "Supervisor",
        factoryAccess: ["factory-1"],
        buildingAccess: ["building-1", "building-2"],
        floorAccess: [],
        lineAccess: [],
        language: "en",
        timezone: "Asia/Ho_Chi_Minh",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "user-3",
        username: "operator1",
        email: "operator1@company.com",
        role: "Operator",
        factoryAccess: ["factory-1"],
        buildingAccess: ["building-1"],
        floorAccess: ["floor-1-1", "floor-1-2"],
        lineAccess: [],
        language: "vi",
        timezone: "Asia/Ho_Chi_Minh",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: "user-4",
        username: "viewer1",
        email: "viewer1@company.com",
        role: "Viewer",
        factoryAccess: ["factory-2"],
        buildingAccess: [],
        floorAccess: [],
        lineAccess: ["line-f2-1-1-1", "line-f2-1-1-2"],
        language: "en",
        timezone: "Asia/Ho_Chi_Minh",
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ]
  }

  // Role permission methods
  async getRolePermissions(role: string): Promise<RolePermissions | null> {
    return this.rolePermissions.get(role) || null
  }

  async updateRolePermissions(role: string, permissions: RolePermissions): Promise<void> {
    this.rolePermissions.set(role, permissions)
  }

  async getUserPermissions(userId: string): Promise<RolePermissions | null> {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return null

    const basePermissions = this.rolePermissions.get(user.role)
    if (!basePermissions) return null

    // Merge user-specific access restrictions
    return {
      ...basePermissions,
      factoryAccess: user.factoryAccess.length > 0 ? user.factoryAccess : basePermissions.factoryAccess,
      buildingAccess: user.buildingAccess.length > 0 ? user.buildingAccess : basePermissions.buildingAccess,
      floorAccess: user.floorAccess.length > 0 ? user.floorAccess : basePermissions.floorAccess,
      lineAccess: user.lineAccess.length > 0 ? user.lineAccess : basePermissions.lineAccess,
    }
  }

  // Device relocation method
  async moveDevice(
    deviceId: string,
    newFactoryId: string,
    newBuildingId: string,
    newFloorId: string,
    newLineId: string,
  ): Promise<boolean> {
    const deviceIndex = this.devices.findIndex((d) => d.id === deviceId)
    if (deviceIndex === -1) return false

    const device = this.devices[deviceIndex]

    // Remove from old line
    const oldFactory = this.factories.find((f) => f.id === device.factoryId)
    const oldBuilding = oldFactory?.buildings.find((b) => b.id === device.buildingId)
    const oldFloor = oldBuilding?.floors.find((f) => f.id === device.floorId)
    const oldLine = oldFloor?.lines.find((l) => l.id === device.lineId)

    if (oldLine) {
      oldLine.devices = oldLine.devices.filter((d) => d.id !== deviceId)
    }

    // Update device properties
    this.devices[deviceIndex] = {
      ...device,
      factoryId: newFactoryId,
      buildingId: newBuildingId,
      floorId: newFloorId,
      lineId: newLineId,
    }

    // Add to new line
    const newFactory = this.factories.find((f) => f.id === newFactoryId)
    const newBuilding = newFactory?.buildings.find((b) => b.id === newBuildingId)
    const newFloor = newBuilding?.floors.find((f) => f.id === newFloorId)
    const newLine = newFloor?.lines.find((l) => l.id === newLineId)

    if (newLine) {
      newLine.devices.push(this.devices[deviceIndex])
    }

    return true
  }

  // Simulate real-time data generation for more devices
  generateRealtimeData() {
    const now = new Date().toISOString()

    this.devices.forEach((device) => {
      if (device.status === "Online") {
        const data: DeviceData = {
          deviceId: device.id,
          timestamp: now,
          power: device.ratedPower * (0.7 + Math.random() * 0.3),
          voltage: 220 + Math.random() * 20 - 10,
          current: ((device.ratedPower * 1000) / 220) * (0.7 + Math.random() * 0.3),
          powerFactor: 0.8 + Math.random() * 0.15,
          status: Math.random() > 0.05 ? "ON" : "OFF",
          temperature: 25 + Math.random() * 15,
          vibration: Math.random() * 5,
        }
        this.deviceData.push(data)
      }
    })

    // Keep only last 1000 data points per device for memory management
    if (this.deviceData.length > this.devices.length * 100) {
      this.deviceData = this.deviceData.slice(-this.devices.length * 50)
    }
  }

  // Enhanced device filtering with permission checks
  async getDevicesWithPermissions(
    userId: string,
    factoryId?: string,
    buildingId?: string,
    floorId?: string,
    lineId?: string,
  ): Promise<Device[]> {
    const permissions = await this.getUserPermissions(userId)
    if (!permissions) return []

    let filtered = this.devices

    // Apply permission-based filtering
    if (permissions.factoryAccess.length > 0) {
      filtered = filtered.filter((d) => permissions.factoryAccess.includes(d.factoryId))
    }
    if (permissions.buildingAccess.length > 0) {
      filtered = filtered.filter((d) => permissions.buildingAccess.includes(d.buildingId))
    }
    if (permissions.floorAccess.length > 0) {
      filtered = filtered.filter((d) => permissions.floorAccess.includes(d.floorId))
    }
    if (permissions.lineAccess.length > 0) {
      filtered = filtered.filter((d) => permissions.lineAccess.includes(d.lineId))
    }

    // Apply additional filters
    if (factoryId) filtered = filtered.filter((d) => d.factoryId === factoryId)
    if (buildingId) filtered = filtered.filter((d) => d.buildingId === buildingId)
    if (floorId) filtered = filtered.filter((d) => d.floorId === floorId)
    if (lineId) filtered = filtered.filter((d) => d.lineId === lineId)

    return filtered
  }

  // Get devices outside current floor for drag-and-drop
  async getDevicesOutsideFloor(currentFloorId: string): Promise<Device[]> {
    return this.devices.filter((d) => d.floorId !== currentFloorId)
  }

  // Existing methods remain the same...
  async getFactories(): Promise<Factory[]> {
    return this.factories
  }

  async getDevices(factoryId?: string, buildingId?: string, floorId?: string, lineId?: string): Promise<Device[]> {
    let filtered = this.devices
    if (factoryId) filtered = filtered.filter((d) => d.factoryId === factoryId)
    if (buildingId) filtered = filtered.filter((d) => d.buildingId === buildingId)
    if (floorId) filtered = filtered.filter((d) => d.floorId === floorId)
    if (lineId) filtered = filtered.filter((d) => d.lineId === lineId)
    return filtered
  }

  async getDeviceData(deviceId: string, limit = 100): Promise<DeviceData[]> {
    return this.deviceData
      .filter((d) => d.deviceId === deviceId)
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  async getLatestDeviceData(deviceId: string): Promise<DeviceData | null> {
    const data = this.deviceData
      .filter((d) => d.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return data[0] || null
  }

  async createDevice(device: Omit<Device, "id" | "createdAt">): Promise<Device> {
    const newDevice: Device = {
      ...device,
      id: `device-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    this.devices.push(newDevice)
    return newDevice
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | null> {
    const index = this.devices.findIndex((d) => d.id === id)
    if (index === -1) return null

    this.devices[index] = { ...this.devices[index], ...updates }
    return this.devices[index]
  }

  async deleteDevice(id: string): Promise<boolean> {
    const index = this.devices.findIndex((d) => d.id === id)
    if (index === -1) return false

    this.devices.splice(index, 1)
    return true
  }

  async getUsers(): Promise<User[]> {
    return this.users
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    this.users.push(newUser)
    return newUser
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return null

    this.users[index] = { ...this.users[index], ...updates }
    return this.users[index]
  }

  async getAlerts(limit = 50): Promise<Alert[]> {
    return this.alerts.slice(-limit)
  }

  async createAlert(alert: Omit<Alert, "id">): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}`,
    }
    this.alerts.push(newAlert)
    return newAlert
  }

  async getSettings(): Promise<SystemSettings> {
    return this.settings
  }

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    this.settings = { ...this.settings, ...updates }
    return this.settings
  }

  async addAuditLog(log: Omit<AuditLog, "id">): Promise<void> {
    this.auditLogs.push({
      ...log,
      id: `audit-${Date.now()}`,
    })
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return this.auditLogs.slice(-limit)
  }
}

export const db = new SimulatedDatabase()

// Start real-time data simulation
if (typeof window !== "undefined") {
  setInterval(() => {
    db.generateRealtimeData()
  }, 1000) // Generate data every second
}
