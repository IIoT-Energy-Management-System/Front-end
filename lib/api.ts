import type { Alert, AnalyticsData, ApiPermission, AuditLogEntry, Building, ConnectionLogEntry, DashboardStats, DbConfig, Device, EnergySettings, Factory, Floor, Line, RankingData, Report, ReportData, Role, Shift, SmtpConfig, User } from './types';

const API_BASE_URL = 'http://localhost:5000'

// Global flag để prevent multiple authentication error handling
let isHandlingAuthError = false

// Helper function để lấy access token
function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken')
  }
  return null
}

// Helper function để tạo headers với Authorization
function createAuthHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// Helper function để thực hiện authenticated fetch với retry
async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const isFormData = options.body instanceof FormData
  
  // Tạo headers mới, không set Content-Type nếu là FormData
  const headers: Record<string, string> = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  // Nếu không phải FormData, set Content-Type mặc định
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  // Merge với additional headers từ options
  const finalHeaders = { ...headers, ...options.headers }
  
  const finalOptions: RequestInit = {
    ...options,
    headers: finalHeaders
  }
  
  let response: Response
  try {
    response = await fetch(url, finalOptions)
  } catch (networkError) {
    // Tắt console.log cho network errors, chỉ throw error
    const errorMessage = networkError instanceof Error ? networkError.message : 'Unknown network error'
    throw new Error(`Network error: ${errorMessage}`)
  }
  
  // Nếu 403 (token expired) và chưa thử refresh, thử refresh token và retry
  if (response.status === 403 && !(finalOptions.headers as any)?.['X-Retry']) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      // Retry với token mới
      const newHeaders = createAuthHeaders()
      const retryOptions: RequestInit = {
        ...options,
        headers: {
          ...newHeaders,
          ...options.headers,
          'X-Retry': 'true'
        }
      }
      response = await fetch(url, retryOptions)
    } else {
      // Refresh token failed - logout user và throw authentication error
      await handleAuthenticationFailure()
      throw new Error('Authentication failed - token expired and refresh failed')
    }
  }
  
  // Nếu vẫn 403 sau khi retry, cũng coi như authentication failed
  if (response.status === 403) {
    await handleAuthenticationFailure()
    throw new Error('Authentication failed - access denied')
  }
  
  return response
}

// Helper function để handle authentication failure
async function handleAuthenticationFailure(): Promise<void> {
  if (isHandlingAuthError) return // Prevent multiple handling
  
  isHandlingAuthError = true
  
  try {
    // Import authService dynamically để tránh circular dependency
    const { authService } = await import('./auth')
    await authService.logout()
    
    // Redirect về login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  } catch (error) {
    console.error('Failed to handle authentication failure:', error)
  } finally {
    // Reset flag after a delay to allow for page redirect
    setTimeout(() => {
      isHandlingAuthError = false
    }, 1000)
  }
}

// Helper function để refresh token
async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return false

    const response = await fetch(`${API_BASE_URL}/api/users/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken)
        await setPermissionsFromToken(data.data.accessToken)
        return true
      }
    }
    return false
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

// Helper function để lấy permissions từ token và cập nhật authService
async function setPermissionsFromToken(token: string): Promise<void> {
  try {
    // Import authService và gọi method setPermissionsFromToken của nó
    const { authService } = await import('./auth')
    authService.setPermissionsFromToken(token)
    
  } catch (error) {
    console.error('Failed to set permissions from token:', error)
  }
}

// Helper function để xử lý response
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text()
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: errorText };
    }
    
    // Nếu là 401 hoặc 403, đã được handle trong authenticatedFetch
    // Nhưng để chắc chắn, throw error với thông tin rõ ràng
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication error: ${errorData.error || 'Access denied'}`);
    }
    
    throw errorData;
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
    
    if (filters) {/* Lines 34-39 omitted */}
    
    const url = `${API_BASE_URL}/api/devices${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await authenticatedFetch(url)
    const result = await handleResponse<{ success: boolean; data: Device[] }>(response)
    return result.data || []
  }

  // GET /api/devices/:id - Lấy chi tiết thiết bị
  static async getDeviceById(id: string): Promise<Device> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/devices/${id}`)
    const result = await handleResponse<{ success: boolean; data: Device }>(response)
    return result.data
  }

  // GET /api/lines/:lineId/devices - Lấy thiết bị theo chuyền
  static async getDevicesByLine(lineId: string): Promise<Device[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/lines/${lineId}/devices`)
    const result = await handleResponse<{ success: boolean; data: Device[] }>(response)
    return result.data || []
  }

  // POST /api/devices - Thêm thiết bị mới
  static async createDevice(deviceData: Omit<Device, 'id' | 'createdAt' | 'lastSeen' | 'connections'>): Promise<Device> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/devices`, {
      method: 'POST',
      body: JSON.stringify(deviceData),
    })
    const result = await handleResponse<{ success: boolean; data: Device }>(response)
    return result.data
  }

  // PUT /api/devices/:id - Cập nhật thiết bị
  static async updateDevice(id: string, deviceData: Partial<Device>): Promise<Device> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deviceData),
    })
    const result = await handleResponse<{ success: boolean; data: Device }>(response)
    return result.data
  }

  // DELETE /api/devices/:id - Xóa thiết bị
  static async deleteDevice(id: string): Promise<Device> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/devices/${id}`, {
      method: 'DELETE',
    })
    
    const result = await handleResponse<{ success: boolean; data: Device }>(response)
    return result.data
  }

  // PUT /api/devices/:id/status - Cập nhật trạng thái thiết bị
  static async updateDeviceStatus(id: string, status: Device['status']): Promise<Device> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/devices/${id}/status`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/device-connections`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/device-connections/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/device-connections/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/dashboard/overview`)
    return handleResponse(response)
  }

  // GET /api/dashboard/factory/:factoryId - Dashboard theo nhà máy
  static async getFactoryDashboard(factoryId: string): Promise<any> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/dashboard/factory/${factoryId}`)
    return handleResponse(response)
  }

  // GET /api/real-time/devices/status - Trạng thái thiết bị real-time
  static async getRealTimeDeviceStatus(): Promise<{
    success: boolean
    data: Device[]
  }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/real-time/devices/status`)
    return handleResponse(response)
  }
}

// Factory API Service
export class FactoryApiService {
  // GET /api/factories - Lấy danh sách nhà máy
  static async getFactories(): Promise<Factory[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/factories`)
    const result = await handleResponse<{ success: boolean; data: Factory[] }>(response)
    return result.data || []
  }

  // GET /api/factories/:id - Lấy chi tiết nhà máy
  static async getFactoryById(id: string): Promise<Factory> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/factories/${id}`)
    const result = await handleResponse<{ success: boolean; data: Factory }>(response)
    return result.data
  }

  // POST /api/factories - Tạo nhà máy mới
  static async createFactory(factoryData: {
    name: string
    location: string
    timezone: string
  }): Promise<Factory> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/factories`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/factories/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/factories/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/buildings`)
    const result = await handleResponse<{ success: boolean; data: Building[] }>(response)
    return result.data || []
  }

  // GET /api/buildings/:id - Lấy chi tiết tòa nhà
  static async getBuildingById(id: string): Promise<Building> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/buildings/${id}`)
    const result = await handleResponse<{ success: boolean; data: Building }>(response)
    return result.data
  }

  // GET /api/factories/:factoryId/buildings - Lấy tòa nhà theo nhà máy
  static async getBuildingsByFactory(factoryId: string): Promise<Building[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/buildings?factoryId=${factoryId}`)
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/buildings?factoryIds=${factoryIdsParam}`)
    const result = await handleResponse<{ success: boolean; data: Building[] }>(response)
    return result.data || []
  }

  // POST /api/buildings - Tạo tòa nhà mới
  static async createBuilding(buildingData: {
    name: string
    factoryId: string
  }): Promise<Building> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/buildings`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/buildings/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/buildings/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/floors`)
    const result = await handleResponse<{ success: boolean; data: Floor[] }>(response)
    return result.data
  }

  // GET /api/floors/:id - Lấy chi tiết tầng
  static async getFloorById(id: string): Promise<Floor[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/floors/${id}`)
    const result = await handleResponse<{ success: boolean; data: Floor[] }>(response)
    return result.data
  }

  // GET /api/buildings/:buildingId/floors - Lấy tầng theo tòa nhà
  static async getFloorsByBuilding(buildingId: string): Promise<Floor[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/floors?buildingId=${buildingId}`)
    const result = await handleResponse<{ success: boolean; data: Floor[] }>(response)
    return result.data
  }

  // POST /api/floors - Tạo tầng mới
  static async createFloor(floorData: {
    name: string
    buildingId: string
  }): Promise<Floor[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/floors`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/floors/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/floors/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/lines`)
    const result = await handleResponse<{ success: boolean; data: Line[] }>(response)
    return result.data
  }

  // GET /api/lines/:id - Lấy chi tiết chuyền
  static async getLineById(id: string): Promise<Line[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/lines/${id}`)
    const result = await handleResponse<{ success: boolean; data: Line[] }>(response)
    return result.data
  }

  // GET /api/floors/:floorId/lines - Lấy chuyền theo tầng
  static async getLinesByFloor(floorId: string): Promise<Line[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/lines?floorId=${floorId}`)
    const result = await handleResponse<{ success: boolean; data: Line[] }>(response)
    return result.data
  }

  // POST /api/lines - Tạo chuyền mới
  static async createLine(lineData: {
    name: string
    floorId: string
  }): Promise<Line[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/lines`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/lines/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/lines/${id}`, {
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
        const response = await authenticatedFetch(`${API_BASE_URL}/api/alerts`)
        return handleResponse(response)
    }

    static async getAlertsActive(): Promise<Alert[]>{
        const response = await authenticatedFetch(`${API_BASE_URL}/api/alerts/active`)
        return handleResponse(response)
    }

    static async confirmAcknowledgeAlert(alertId: string, user: { userId: string, acknowledgmentNote: string}): Promise<void>{
        const response = await authenticatedFetch(`${API_BASE_URL}/api/alerts/${alertId}/acknowledge`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Acknowledge alert failed: ${errorText}`)
        }
        // console.log("UserL",user)
    }

    static async confirmResolveAlert(alertId: string): Promise<void>{
        const response = await authenticatedFetch(`${API_BASE_URL}/api/alerts/${alertId}/resolve`, {
            method: 'PUT',
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Resolve alert failed: ${errorText}`)
        }
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
    const response = await authenticatedFetch(url);
    const result = await handleResponse<{ success: boolean; data: AnalyticsData }>(response);
    return result.data;
  }

  // GET /api/analytics/rankings - Get performance rankings
  static async getRankings(): Promise<RankingData> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/analytics/rankings`);
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
    const response = await authenticatedFetch(url);
    const result = await handleResponse<{ success: boolean; data: ReportData }>(response);
    return result.data;
  }
}

export class UserApiService {
  // GET /api/users - Lấy danh sách người dùng
  static async getUsers(): Promise<User[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users`)
    const result = await handleResponse<{ success: boolean; data: User[] }>(response)
    return result.data
  }

  // GET /api/users/:id - Lấy chi tiết người dùng
  static async getUserById(id: string): Promise<User> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${id}`)
    const result = await handleResponse<{ success: boolean; data: User }>(response)
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    const result = await handleResponse<{ success: boolean; data: User }>(response)
    return result.data
  }

  static async resetPassword(token: string, userId: string, password: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        userId,
        newPassword: password,
      }),
    })
    const result = await handleResponse<{ success: boolean; data: any }>(response)
    return result.data
  }

  static async resendEmail(userId: string): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/api/users/resend-reset-email`, {
      method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
    })
    const result = await handleResponse<{ success: boolean; data: any }>(response)
    return result.data
  }

  // PUT /api/users/:id - Cập nhật người dùng
  static async updateUser(id: string, userData: {
    username: string
    email: string
    roleId: string
    factoryAccess?: string[]
    buildingAccess?: string[]
    floorAccess?: string[]
    lineAccess?: string[]
    language?: "en" | "vi"
    timezone?: string
  }): Promise<User[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
    const result = await handleResponse<{ success: boolean; data: User[] }>(response)
    return result.data
  }

  // PUT /api/users/:id/password - Đổi mật khẩu
  static async changePassword(id: string, passwordData: {
    currentPassword: string
    newPassword: string
  }): Promise<User[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${id}/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    })
    
    const result = await handleResponse<{ success: boolean; data: User[] }>(response)
    return result.data
  }

  static async updateProfile(id: string, profileData: {
    username?: string
    email?: string
    language?: "en" | "vi"
    timezone?: string
  }): Promise<User[]> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${id}/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    })

    const result = await handleResponse<{ success: boolean; data: User[] }>(response)
    return result.data
  }

  // DELETE /api/users/:id - Xóa người dùng
  static async deleteUser(id: string): Promise<void> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${id}`, {
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
    const response = await authenticatedFetch(`${API_BASE_URL}/api/roles`)
    const result = await handleResponse<{ success: boolean; data: Role[] }>(response)
    return result.data
  }

  // GET /api/roles/:id - Lấy chi tiết vai trò
  static async getRoleById(id: string): Promise<any> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/roles/${id}`)
    const result = await handleResponse<{ success: boolean; data: Role[] }>(response)
    return result.data
  }

  // POST /api/roles - Tạo vai trò mới
  static async createRole(roleData: {
    name: string
    permissions: string[]
  }): Promise<any> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/roles`, {
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
    description: string
  }): Promise<any> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/roles/${id}`, {
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
  static async deleteRole(id: string): Promise<any> {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/roles/${id}`, {
      method: 'DELETE',
    })
    
    const result = await handleResponse<{ success: boolean; data: Role[] }>(response)
    return result.data
  }
}


export class PermissionApiService {
    // GET /api/permissions - Lấy danh sách permission
    static async getPermissions(): Promise<ApiPermission[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/permissions`);
        const result = await handleResponse<{ success: boolean; data: ApiPermission[] }>(response);
        return result.data;
    }

    static async updateRolePermissions(roleId: string, permissions: string[]): Promise<any> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/permissions/${roleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ permissions }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Update permissions failed: ${errorText}`);
        }
        return await handleResponse<{ success: boolean; data: any }>(response)
        // return result.data
    }
}

export class DbConfigApiService {
    // GET /api/db-config - Lấy cấu hình database
    static async getDbConfig(): Promise<DbConfig> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/db-config/config`);
        const result = await handleResponse<{ success: boolean; data: DbConfig }>(response);
        return result.data;
    }

    // PUT /api/db-config - Cập nhật cấu hình database
    static async updateDbConfig(dbConfig: DbConfig): Promise<any> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/db-config/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dbConfig),
        });

        return await handleResponse<{ success: boolean; data: any }>(response)
    }

    static async testDbConnection(dbConfig: DbConfig): Promise<any> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/db-config/test-temp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dbConfig),
        });

        return await handleResponse<{ success: boolean; data: any }>(response)
    }
}

export class SmtpConfigApiService {
    // GET /api/smtp-config - Lấy cấu hình SMTP
    static async getSmtpConfig(): Promise<SmtpConfig> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/smtp-config/config`);
        const result = await handleResponse<{ success: boolean; data: SmtpConfig }>(response);
        return result.data;
    }

    // PUT /api/smtp-config - Cập nhật cấu hình SMTP
    static async updateSmtpConfig(smtpConfig: SmtpConfig): Promise<any> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/smtp-config/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(smtpConfig),
        });

        return await handleResponse<{ success: boolean; data: any }>(response)
    }

    static async testSmtpConnection(smtpConfig: SmtpConfig): Promise<any> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/smtp-config/test-temp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(smtpConfig),
        });

        return await handleResponse<{ success: boolean; data: any }>(response)
    }
}

export class EnergySettingsApiService {
    // GET /api/energy-settings - Lấy cài đặt năng lượng hiện tại
    static async getEnergySettings(): Promise<EnergySettings> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/energy-settings`);
        const result = await handleResponse<{ success: boolean; data: EnergySettings }>(response);
        return result.data;
    }

    // PUT /api/energy-settings - Cập nhật cài đặt năng lượng
    static async updateEnergySettings(settingsData: {
        type: 'flat' | 'timeOfUse';
        flatRate?: number;
        timeOfUseData?: Array<{
            startTime: string;
            endTime: string;
            rate: number;
        }>;
    }): Promise<EnergySettings> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/energy-settings`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settingsData),
        });
        const result = await handleResponse<{ success: boolean; data: EnergySettings }>(response);
        return result.data;
    }
}

export class ShiftApiService {
    // GET /api/shifts - Lấy danh sách ca làm việc
    static async getShifts(): Promise<Shift[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/shifts`);
        const result = await handleResponse<{ success: boolean; data: Shift[] }>(response);
        return result.data;
    }

    // POST /api/shifts/save - Thay thế tất cả ca làm việc
    static async saveShifts(shifts: Shift[]): Promise<Shift[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/shifts/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shifts }),
        });
        const result = await handleResponse<{ success: boolean; data: Shift[] }>(response);
        return result.data;
    }
}

export class ReportApiService {
    // GET /api/reports - Lấy danh sách báo cáo
    static async getReports(): Promise<Report[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/reports`);
        const result = await handleResponse<{ success: boolean; data: Report[] }>(response);
        return result.data;
    }

    // POST /api/reports - Tạo báo cáo mới
    static async createReport(reportData: Report): Promise<Report> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData),
        });

        const result = await handleResponse<{ success: boolean; data: Report }>(response);
        return result.data;
    }

    // GET /api/reports/export/:id?format= - Xuất báo cáo
    static async exportReport(id: string, format: 'pdf' | 'excel'): Promise<Blob> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/reports/export/${id}?format=${format}`);
        return response.blob();
    }
}

export class LogApiService {
    // GET /api/logs/audit - Lấy danh sách audit logs
    static async getAuditLogs(): Promise<AuditLogEntry[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/logs/audit`);
        const result = await handleResponse<{ success: boolean; data: AuditLogEntry[] }>(response);
        return result.data;
    }

    // GET /api/logs/connection - Lấy danh sách connection logs
    static async getConnectionLogs(): Promise<ConnectionLogEntry[]> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/logs/connection`);
        const result = await handleResponse<{ success: boolean; data: ConnectionLogEntry[] }>(response);
        return result.data;
    }
}

export class BackupApiService {
    // GET /api/backup/backup - Tạo bản sao lưu
    static async createBackup(): Promise<Blob> {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/backup/backup`);
        if (!response.ok) {
            // Nếu lỗi HTTP, lấy error từ response
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText };
            }
            throw new Error(errorData.error || 'Backup failed');
        }
        // Nếu API trả về success: false trong body (nhưng HTTP vẫn ok)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const result = await response.clone().json();
            if (result && result.success === false) {
                throw new Error(result.error || 'Backup failed');
            }
        }
        return response.blob();
    }

    // POST /api/backup/restore - Khôi phục từ bản sao lưu
    static async restoreBackup(backupFile: File): Promise<{ success: boolean; message?: string; error?: string }> {
        const formData = new FormData();
        formData.append('backupFile', backupFile);

        const response = await authenticatedFetch(`${API_BASE_URL}/api/backup/restore`, {
            method: 'POST',
            body: formData
        });

        return handleResponse<{ success: boolean; message?: string; error?: string }>(response);
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
  return {
    getAlerts: AlertApiService.getAlerts,
    getAlertsActive: AlertApiService.getAlertsActive,
    confirmAcknowledgeAlert: AlertApiService.confirmAcknowledgeAlert,
    confirmResolveAlert: AlertApiService.confirmResolveAlert,
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
    resetPassword: UserApiService.resetPassword,
    updateUser: UserApiService.updateUser,
    changePassword: UserApiService.changePassword,
    updateProfile: UserApiService.updateProfile,
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

export function usePermissionApi() {
    return {
        getPermissions: PermissionApiService.getPermissions,
        updateRolePermissions: PermissionApiService.updateRolePermissions,
    }
}

export function useDbConfigApi() {
    return {
        getDbConfig: DbConfigApiService.getDbConfig,
        updateDbConfig: DbConfigApiService.updateDbConfig,
        testDbConnection: DbConfigApiService.testDbConnection,
    }
}

export function useSmtpConfigApi() {
    return {
        getSmtpConfig: SmtpConfigApiService.getSmtpConfig,
        updateSmtpConfig: SmtpConfigApiService.updateSmtpConfig,
        testSmtpConnection: SmtpConfigApiService.testSmtpConnection,
    }
}

export function useShiftApi() {
    return {
        getShifts: ShiftApiService.getShifts,
        saveShifts: ShiftApiService.saveShifts,
    }
}

export function useReportApi() {
    return {
        getReports: ReportApiService.getReports,
        createReport: ReportApiService.createReport,
        exportReport: ReportApiService.exportReport,
    }
}

export function useLogApi() {
    return {
        getAuditLogs: LogApiService.getAuditLogs,
        getConnectionLogs: LogApiService.getConnectionLogs,
    }
}

export function useBackupApi() {
    return {
        createBackup: BackupApiService.createBackup,
    }
}

export function useEnergySettingsApi() {
    return {
        getEnergySettings: EnergySettingsApiService.getEnergySettings,
        updateEnergySettings: EnergySettingsApiService.updateEnergySettings,
    }
}

// Utility functions for error handling
export function isAuthenticationError(error: any): boolean {
  return error && (
    error.message?.includes('Authentication failed') ||
    error.message?.includes('Access denied') ||
    error.error === 'Unauthorized' ||
    error.error === 'Forbidden' ||
    error.status === 401 ||
    error.status === 403
  )
}

export function handleApiError(error: any, defaultMessage: string = 'Có lỗi xảy ra'): string {
  if (isAuthenticationError(error)) {
    // Authentication errors are handled globally, don't show toast
    return ''
  }
  
  // Return error message for other types of errors
  return error.message || error.error || defaultMessage
}
