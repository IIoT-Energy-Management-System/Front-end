import type { Alert, AnalyticsData, Building, DashboardStats, Device, Factory, Floor, Line, RankingData, ReportData, Role, User } from './types'

const API_BASE_URL = 'http://localhost:5000'

// Helper function để xử lý response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text()
    let errorData;
    try {
      errorData = JSON.parse(errorText);  // Parse JSON từ backend
    } catch {
      errorData = { error: errorText };  // Fallback nếu không phải JSON
    }
    throw errorData;  // Throw object trực tiếp
  }
  return response.json()
}

// Device API Service
export class DeviceApiService {
  // GET /api/devices - Lấy danh sách thiết bị (có filter)
  static async getDevices(filters?: {
    factoryId?: string
    buildingId?: string
    floorId?: string
    lineId?: string
    status?: string
    type?: string
  }): Promise<Device[]> {
    const searchParams = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value)
        }
      })
    }
    
    const url = `${API_BASE_URL}/api/devices${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await fetch(url)
    const result = await handleResponse<{ success: boolean; data: Device[] }>(response)
    return result.data || []
  }

  // GET /api/devices/:id - Lấy chi tiết thiết bị
  static async getDeviceById(id: string): Promise<Device> {
    const response = await fetch(`${API_BASE_URL}/api/devices/${id}`)
    const result = await handleResponse<{ success: boolean; data: Device }>(response)
    return result.data
  }

  // GET /api/lines/:lineId/devices - Lấy thiết bị theo chuyền
  static async getDevicesByLine(lineId: string): Promise<Device[]> {
    const response = await fetch(`${API_BASE_URL}/api/lines/${lineId}/devices`)
    const result = await handleResponse<{ success: boolean; data: Device[] }>(response)
    return result.data || []
  }

  // POST /api/devices - Thêm thiết bị mới
  static async createDevice(deviceData: Omit<Device, 'id' | 'createdAt' | 'lastSeen' | 'connections'>): Promise<Device> {
    const response = await fetch(`${API_BASE_URL}/api/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    })
    const result = await handleResponse<{ success: boolean; data: Device }>(response)
    return result.data
  }

  // PUT /api/devices/:id - Cập nhật thiết bị
  static async updateDevice(id: string, deviceData: Partial<Device>): Promise<Device> {
    const response = await fetch(`${API_BASE_URL}/api/devices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    })
    const result = await handleResponse<{ success: boolean; data: Device }>(response)
    return result.data
  }

  // DELETE /api/devices/:id - Xóa thiết bị
  static async deleteDevice(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/devices/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete failed: ${errorText}`)
    }
  }

  // PUT /api/devices/:id/status - Cập nhật trạng thái thiết bị
  static async updateDeviceStatus(id: string, status: Device['status']): Promise<Device> {
    const response = await fetch(`${API_BASE_URL}/api/devices/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })
    const result = await handleResponse<{ success: boolean; data: Device }>(response)
    return result.data
  }

  // POST /api/device-connections - Thêm kết nối cho thiết bị
  static async createDeviceConnection(connectionData: {
    deviceId: string
    type: string
    config: any
    priority: number
    isActive: boolean
    healthStatus: string
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/device-connections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connectionData),
    })
    const result = await handleResponse<{ success: boolean; data: any }>(response)
    return result.data
  }

  // PUT /api/device-connections/:id - Cập nhật kết nối
  static async updateDeviceConnection(id: string, connectionData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/device-connections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(connectionData),
    })
    const result = await handleResponse<{ success: boolean; data: any }>(response)
    return result.data
  }

  // DELETE /api/device-connections/:id - Xóa kết nối
  static async deleteDeviceConnection(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/device-connections/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete connection failed: ${errorText}`)
    }
  }
}

// Dashboard API Service
export class DashboardApiService {
  // GET /api/dashboard/overview - Tổng quan dashboard
  static async getDashboardOverview(): Promise<DashboardStats[]> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/overview`)
    return handleResponse(response)
  }

  // GET /api/dashboard/factory/:factoryId - Dashboard theo nhà máy
  static async getFactoryDashboard(factoryId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/factory/${factoryId}`)
    return handleResponse(response)
  }

  // GET /api/real-time/devices/status - Trạng thái thiết bị real-time
  static async getRealTimeDeviceStatus(): Promise<{
    success: boolean
    data: Device[]
  }> {
    const response = await fetch(`${API_BASE_URL}/api/real-time/devices/status`)
    return handleResponse(response)
  }
}

// Factory API Service
export class FactoryApiService {
  // GET /api/factories - Lấy danh sách nhà máy
  static async getFactories(): Promise<Factory[]> {
    const response = await fetch(`${API_BASE_URL}/api/factories`)
    const result = await handleResponse<{ success: boolean; data: Factory[] }>(response)
    return result.data || []
  }

  // GET /api/factories/:id - Lấy chi tiết nhà máy
  static async getFactoryById(id: string): Promise<Factory> {
    const response = await fetch(`${API_BASE_URL}/api/factories/${id}`)
    const result = await handleResponse<{ success: boolean; data: Factory }>(response)
    return result.data
  }

  // POST /api/factories - Tạo nhà máy mới
  static async createFactory(factoryData: {
    name: string
    location: string
    timezone: string
  }): Promise<Factory> {
    const response = await fetch(`${API_BASE_URL}/api/factories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(factoryData),
    })
    const result = await handleResponse<{ success: boolean; data: Factory }>(response)
    return result.data
  }

  // PUT /api/factories/:id - Cập nhật nhà máy
  static async updateFactory(id: string, factoryData: {
    name?: string
    location?: string
    timezone?: string
  }): Promise<Factory> {
    const response = await fetch(`${API_BASE_URL}/api/factories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(factoryData),
    })
    const result = await handleResponse<{ success: boolean; data: Factory }>(response)
    return result.data
  }

  // DELETE /api/factories/:id - Xóa nhà máy
  static async deleteFactory(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/factories/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete factory failed: ${errorText}`)
    }
  }
}

// Building API Service
export class BuildingApiService {
  // GET /api/buildings - Lấy danh sách tòa nhà
  static async getBuildings(): Promise<Building[]> {
    const response = await fetch(`${API_BASE_URL}/api/buildings`)
    const result = await handleResponse<{ success: boolean; data: Building[] }>(response)
    return result.data || []
  }

  // GET /api/buildings/:id - Lấy chi tiết tòa nhà
  static async getBuildingById(id: string): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/api/buildings/${id}`)
    const result = await handleResponse<{ success: boolean; data: Building }>(response)
    return result.data
  }

  // GET /api/factories/:factoryId/buildings - Lấy tòa nhà theo nhà máy
  static async getBuildingsByFactory(factoryId: string): Promise<Building[]> {
    const response = await fetch(`${API_BASE_URL}/api/buildings?factoryId=${factoryId}`)
    const result = await handleResponse<{ success: boolean; data: Building[] }>(response)
    return result.data || []
  }

  // GET /api/buildings?factoryIds=1,2,3 - Lấy tòa nhà theo nhiều nhà máy
  static async getBuildingsByFactoryIds(factoryIds: string[]): Promise<Building[]> {
    if (factoryIds.length === 0) {
      // Nếu không có factory nào được chọn, lấy tất cả buildings
      return this.getBuildings()
    }
    
    const factoryIdsParam = factoryIds.join(',')
    const response = await fetch(`${API_BASE_URL}/api/buildings?factoryIds=${factoryIdsParam}`)
    const result = await handleResponse<{ success: boolean; data: Building[] }>(response)
    return result.data || []
  }

  // POST /api/buildings - Tạo tòa nhà mới
  static async createBuilding(buildingData: {
    name: string
    factoryId: string
  }): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/api/buildings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildingData),
    })
    const result = await handleResponse<{ success: boolean; data: Building }>(response)
    return result.data
  }

  // PUT /api/buildings/:id - Cập nhật tòa nhà
  static async updateBuilding(id: string, buildingData: {
    name?: string
    factoryId?: string
  }): Promise<Building> {
    const response = await fetch(`${API_BASE_URL}/api/buildings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildingData),
    })
    const result = await handleResponse<{ success: boolean; data: Building }>(response)
    return result.data
  }

  // DELETE /api/buildings/:id - Xóa tòa nhà
  static async deleteBuilding(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/buildings/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete building failed: ${errorText}`)
    }
  }
}

// Floor API Service
export class FloorApiService {
  // GET /api/floors - Lấy danh sách tầng
  static async getFloors(): Promise<Floor[]> {
    const response = await fetch(`${API_BASE_URL}/api/floors`)
    const result = await handleResponse<{ success: boolean; data: Floor[] }>(response)
    return result.data
  }

  // GET /api/floors/:id - Lấy chi tiết tầng
  static async getFloorById(id: string): Promise<Floor[]> {
    const response = await fetch(`${API_BASE_URL}/api/floors/${id}`)
    const result = await handleResponse<{ success: boolean; data: Floor[] }>(response)
    return result.data
  }

  // GET /api/buildings/:buildingId/floors - Lấy tầng theo tòa nhà
  static async getFloorsByBuilding(buildingId: string): Promise<Floor[]> {
    const response = await fetch(`${API_BASE_URL}/api/floors?buildingId=${buildingId}`)
    const result = await handleResponse<{ success: boolean; data: Floor[] }>(response)
    return result.data
  }

  // POST /api/floors - Tạo tầng mới
  static async createFloor(floorData: {
    name: string
    buildingId: string
  }): Promise<Floor[]> {
    const response = await fetch(`${API_BASE_URL}/api/floors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(floorData),
    })
    const result = await handleResponse<{ success: boolean; data: Floor[] }>(response)
    return result.data
  }

  // PUT /api/floors/:id - Cập nhật tầng
  static async updateFloor(id: string, floorData: {
    name?: string
    buildingId?: string
  }): Promise<Floor[]> {
    const response = await fetch(`${API_BASE_URL}/api/floors/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(floorData),
    })
    const result = await handleResponse<{ success: boolean; data: Floor[] }>(response)
    return result.data
  }

  // DELETE /api/floors/:id - Xóa tầng
  static async deleteFloor(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/floors/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete floor failed: ${errorText}`)
    }
  }
}

// Line API Service
export class LineApiService {
  // GET /api/lines - Lấy danh sách chuyền
  static async getLines(): Promise<Line[]> {
    const response = await fetch(`${API_BASE_URL}/api/lines`)
    const result = await handleResponse<{ success: boolean; data: Line[] }>(response)
    return result.data
  }

  // GET /api/lines/:id - Lấy chi tiết chuyền
  static async getLineById(id: string): Promise<Line[]> {
    const response = await fetch(`${API_BASE_URL}/api/lines/${id}`)
    const result = await handleResponse<{ success: boolean; data: Line[] }>(response)
    return result.data
  }

  // GET /api/floors/:floorId/lines - Lấy chuyền theo tầng
  static async getLinesByFloor(floorId: string): Promise<Line[]> {
    const response = await fetch(`${API_BASE_URL}/api/lines?floorId=${floorId}`)
    const result = await handleResponse<{ success: boolean; data: Line[] }>(response)
    return result.data
  }

  // POST /api/lines - Tạo chuyền mới
  static async createLine(lineData: {
    name: string
    floorId: string
  }): Promise<Line[]> {
    const response = await fetch(`${API_BASE_URL}/api/lines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lineData),
    })
    const result = await handleResponse<{ success: boolean; data: Line[] }>(response)
    return result.data
  }

  // PUT /api/lines/:id - Cập nhật chuyền
  static async updateLine(id: string, lineData: {
    name?: string
    floorId?: string
  }): Promise<Line[]> {
    const response = await fetch(`${API_BASE_URL}/api/lines/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lineData),
    })
    const result = await handleResponse<{ success: boolean; data: Line[] }>(response)
    return result.data
  }

  // DELETE /api/lines/:id - Xóa chuyền
  static async deleteLine(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/lines/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete line failed: ${errorText}`)
    }
  }
}

export class AlertApiService {
  static async getAlerts(): Promise<Alert[]>{
    const response = await fetch(`${API_BASE_URL}/api/alerts`)
    return handleResponse(response)
  }

  static async getAlertsActive(): Promise<Alert[]>{
    const response = await fetch(`${API_BASE_URL}/api/alerts/active`)
    return handleResponse(response)
  }
}

export class AnalyticApiService {
  // GET /api/analytics - Get analytics overview
  static async getAnalytics(filters?: {
    timeRange?: string
    factoryId?: string
    buildingId?: string
    floorId?: string
  }): Promise<AnalyticsData> {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });
    }
    
    const url = `${API_BASE_URL}/api/analytics${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url);
    const result = await handleResponse<{ success: boolean; data: AnalyticsData }>(response);
    return result.data;
  }

  // GET /api/analytics/rankings - Get performance rankings
  static async getRankings(): Promise<RankingData> {
    const response = await fetch(`${API_BASE_URL}/api/analytics/rankings`);
    const result = await handleResponse<{ success: boolean; data: RankingData }>(response);
    return result.data;
  }

  // GET /api/analytics/reports - Get performance reports
  static async getReports(filters?: {
    period?: string
  }): Promise<ReportData> {
    const searchParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, value);
        }
      });
    }
    
    const url = `${API_BASE_URL}/api/analytics/reports${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(url);
    const result = await handleResponse<{ success: boolean; data: ReportData }>(response);
    return result.data;
  }
}

export class UserApiService {
  // GET /api/users - Lấy danh sách người dùng
  static async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users`)
    const result = await handleResponse<{ success: boolean; data: User[] }>(response)
    return result.data
  }

  // GET /api/users/:id - Lấy chi tiết người dùng
  static async getUserById(id: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`)
    const result = await handleResponse<{ success: boolean; data: User[] }>(response)
    return result.data
  }

  // POST /api/users - Tạo người dùng mới
  static async createUser(userData: {
    username: string
    email: string
    roleId: string
    factoryAccess?: string[]
    buildingAccess?: string[]
    floorAccess?: string[]
    lineAccess?: string[]
    language?: "en" | "vi"
    timezone?: string
  }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    const result = await handleResponse<{ success: boolean; data: User }>(response)
    return result.data
  }

  // PUT /api/users/:id - Cập nhật người dùng
  static async updateUser(id: string, userData: {
    username?: string
    email?: string
    password?: string
    role?: string
  }): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    const result = await handleResponse<{ success: boolean; data: User[] }>(response)
    return result.data
  }

  // DELETE /api/users/:id - Xóa người dùng
  static async deleteUser(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete user failed: ${errorText}`)
    }
  }
}

export class RoleApiService {
  // GET /api/roles - Lấy danh sách vai trò
  static async getRoles(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/roles`)
    const result = await handleResponse<{ success: boolean; data: Role[] }>(response)
    return result.data
  }

  // GET /api/roles/:id - Lấy chi tiết vai trò
  static async getRoleById(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/roles/${id}`)
    const result = await handleResponse<{ success: boolean; data: Role[] }>(response)
    return result.data
  }

  // POST /api/roles - Tạo vai trò mới
  static async createRole(roleData: {
    name: string
    permissions: string[]
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    })
    const result = await handleResponse<{ success: boolean; data: Role[] }>(response)
    return result.data
  }

  // PUT /api/roles/:id - Cập nhật vai trò
  static async updateRole(id: string, roleData: {
    name?: string
    permissions?: string[]
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    })
    const result = await handleResponse<{ success: boolean; data: Role[] }>(response)
    return result.data
  }

  // DELETE /api/roles/:id - Xóa vai trò
  static async deleteRole(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Delete role failed: ${errorText}`)
    }
  }
}
// Hook để sử dụng trong React components
export function useDeviceApi() {
  return {
    getDevices: DeviceApiService.getDevices,
    getDeviceById: DeviceApiService.getDeviceById,
    getDevicesByLine: DeviceApiService.getDevicesByLine,
    createDevice: DeviceApiService.createDevice,
    updateDevice: DeviceApiService.updateDevice,
    deleteDevice: DeviceApiService.deleteDevice,
    updateDeviceStatus: DeviceApiService.updateDeviceStatus,
    createDeviceConnection: DeviceApiService.createDeviceConnection,
    updateDeviceConnection: DeviceApiService.updateDeviceConnection,
    deleteDeviceConnection: DeviceApiService.deleteDeviceConnection,
    // updateDevicePosition: DeviceApiService.updateDevicePosition,
  }
}

export function useDashboardApi() {
  return {
    getDashboardOverview: DashboardApiService.getDashboardOverview,
    getFactoryDashboard: DashboardApiService.getFactoryDashboard,
    getRealTimeDeviceStatus: DashboardApiService.getRealTimeDeviceStatus,
  }
}

export function useFactoryApi() {
  return {
    getFactories: FactoryApiService.getFactories,
    getFactoryById: FactoryApiService.getFactoryById,
    createFactory: FactoryApiService.createFactory,
    updateFactory: FactoryApiService.updateFactory,
    deleteFactory: FactoryApiService.deleteFactory,
  }
}

export function useBuildingApi() {
  return {
    getBuildings: BuildingApiService.getBuildings,
    getBuildingById: BuildingApiService.getBuildingById,
    getBuildingsByFactory: BuildingApiService.getBuildingsByFactory,
    createBuilding: BuildingApiService.createBuilding,
    updateBuilding: BuildingApiService.updateBuilding,
    deleteBuilding: BuildingApiService.deleteBuilding,
  }
}

export function useFloorApi() {
  return {
    getFloors: FloorApiService.getFloors,
    getFloorById: FloorApiService.getFloorById,
    getFloorsByBuilding: FloorApiService.getFloorsByBuilding,
    createFloor: FloorApiService.createFloor,
    updateFloor: FloorApiService.updateFloor,
    deleteFloor: FloorApiService.deleteFloor,
  }
}

export function useLineApi() {
  return {
    getLines: LineApiService.getLines,
    getLineById: LineApiService.getLineById,
    getLinesByFloor: LineApiService.getLinesByFloor,
    createLine: LineApiService.createLine,
    updateLine: LineApiService.updateLine,
    deleteLine: LineApiService.deleteLine,
  }
}

export function useAlertApi() {
  return{
    getAlerts: AlertApiService.getAlerts,
    getAlertsActive: AlertApiService.getAlertsActive,
  }
}

export function useAnalyticApi() {
  return {
    getAnalytics: AnalyticApiService.getAnalytics,
    getRankings: AnalyticApiService.getRankings,
    getReports: AnalyticApiService.getReports,
  };
}

export function useUserApi() {
  return {
    getUsers: UserApiService.getUsers,
    getUserById: UserApiService.getUserById,
    createUser: UserApiService.createUser,
    updateUser: UserApiService.updateUser,
    deleteUser: UserApiService.deleteUser,
  }
}

export function useRoleApi() {
  return {
    getRoles: RoleApiService.getRoles,
    getRoleById: RoleApiService.getRoleById,
    createRole: RoleApiService.createRole,
    updateRole: RoleApiService.updateRole,
    deleteRole: RoleApiService.deleteRole,
  }
}