import type { Alert, AnalyticsData, ApiPermission, AuditLogEntry, Building, ConnectionLogEntry, DashboardStats, DbConfig, Device, EnergySettings, Factory, Floor, Line, RankingData, Report, ReportData, Role, Shift, SmtpConfig, User } from './types';

import axios from "axios"
import { useAppStore } from "./store"

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Gửi cookies
})

// Gắn access token vào request header
api.interceptors.request.use((config) => {
  const { accessToken } = useAppStore.getState()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

// Tự động gọi refresh API khi access token hết hạn
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    // Những API không cần check
    if (
      originalRequest.url.includes("/users/login") ||
      originalRequest.url.includes("/users/refresh") ||
      originalRequest.url.includes("/users/logout")
    ) {
      return Promise.reject(error)
    }

    originalRequest._retryCount = originalRequest._retryCount || 0

    if (error.response?.status === 403 && originalRequest._retryCount < 4) {
      originalRequest._retryCount += 1

      try {
        // Gọi refresh endpoint - refreshToken tự động gửi qua cookie
        const res = await api.post("/users/refresh")
        const newAccessToken = res.data.data.accessToken

        useAppStore.getState().setAccessToken(newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        useAppStore.getState().clearState()
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Helper function để lấy permissions từ token và cập nhật authService
// async function setPermissionsFromToken(token: string): Promise<void> {
//   try {
//     // Import authService và gọi method setPermissionsFromToken của nó
//     const { authService } = await import('./auth')
//     authService.setPermissionsFromToken(token)
    
//   } catch (error) {
//     console.error('Failed to set permissions from token:', error)
//   }
// }

// Device API Service
export class DeviceApiService {
    // GET /devices - Lấy danh sách thiết bị (có filter)
    static async getDevices(filters?: {
        factoryId?: string
        buildingId?: string
        floorId?: string
        lineId?: string
        status?: string
        search?: string
        page?: number
        limit?: number
        minimal?: boolean
    }) {
        const searchParams = new URLSearchParams();
        
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
        }
        
        const url = `/devices${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        const response = await api.get(url)
        
        if (response.data.success === false) return [];
        return response.data
    }

    // GET /devices?minimal=true - Lấy danh sách thiết bị minimal (nhanh hơn)
    static async getDevicesMinimal(page: number = 1, limit: number = 50) {
        const response = await api.get(`/devices?page=${page}&limit=${limit}&minimal=true`);
        if (response.data.success === false) return [];
        return response.data;
    }

    // GET /devices/:id - Lấy chi tiết thiết bị
    static async getDeviceById(id: string) {
        const response = await api.get(`/devices/${id}`)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // GET /lines/:lineId/devices - Lấy thiết bị theo chuyền
    static async getDevicesByLine(lineId: string) {
        const response = await api.get(`/lines/${lineId}/devices`)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // POST /devices - Thêm thiết bị mới
    static async createDevice(deviceData: Device) {
        const response = await api.post(`/devices`, deviceData)
        return response.data.data;
    }

    // PUT /devices/:id - Cập nhật thiết bị
    static async updateDevice(id: string, deviceData: Device) {
        const response = await api.put(`/devices/${id}`, deviceData)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // DELETE /devices/:id - Xóa thiết bị
    static async deleteDevice(id: string) {
        const response = await api.delete(`/devices/${id}`)
        
        // const result = await handleResponse<{ success: boolean; data: Device }>(response)
        return response.data.data;
    }

    // PUT /devices/:id/status - Cập nhật trạng thái thiết bị
    static async updateDeviceStatus(id: string, status: Device['status']) {
        const response = await api.put(`/devices/${id}/status`, status)
        // const result = await handleResponse<{ success: boolean; data: Device }>(response)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // POST /device-connections - Thêm kết nối cho thiết bị
    static async createDeviceConnection(connectionData: {
        deviceId: string
        type: string
        config: any
        priority: number
        isActive: boolean
        healthStatus: string
    }) {
        const response = await api.post(`/device-connections`, connectionData)
        // const result = await handleResponse<{ success: boolean; data: any }>(response)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // PUT /device-connections/:id - Cập nhật kết nối
    static async updateDeviceConnection(id: string, connectionData: any) {
        const response = await api.put(`/device-connections/${id}`, connectionData)
        // const result = await handleResponse<{ success: boolean; data: any }>(response)
        if (response.data.success === false) return [];
        return response.data.data;
    }
    // DELETE /device-connections/:id - Xóa kết nối
    static async deleteDeviceConnection(id: string): Promise<void> {
        const response = await api.delete(`/device-connections/${id}`)
        
        if (!response.data.success) {
        throw new Error(`Delete connection failed: ${response.data.error}`)
        }
    }
}

// Dashboard API Service
export class DashboardApiService {
    // GET /dashboard/overview - Tổng quan dashboard
    static async getDashboardOverview() {
        const response = await api.get(`/dashboard/overview`)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // GET /dashboard/factory/:factoryId - Dashboard theo nhà máy
    static async getFactoryDashboard(factoryId: string): Promise<any> {
        const response = await api.get(`/dashboard/factory/${factoryId}`)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // GET /real-time/devices/status - Trạng thái thiết bị real-time
    static async getRealTimeDeviceStatus() {
        const response = await api.get(`/real-time/devices/status`)
        if (response.data.success === false) return [];
        return response.data.data;
    }
}

// Factory API Service
export class FactoryApiService {
    // GET /factories - Lấy danh sách nhà máy
    static async getFactories() {
        const response = await api.get(`/factories`)
        // const result = await handleResponse<{ success: boolean; data: Factory[] }>(response)
        if (response.data.success === false) return [];
        return response.data.data
    }

    // GET /factories/:id - Lấy chi tiết nhà máy
    static async getFactoryById(id: string) {
        const response = await api.get(`/factories/${id}`)
        // const result = await handleResponse<{ success: boolean; data: Factory }>(response)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // POST /factories - Tạo nhà máy mới
    static async createFactory(factoryData: {
        name: string
        location: string
        timezone: string
    }) {
        const response = await api.post(`/factories`, factoryData)
        // const result = await handleResponse<{ success: boolean; data: Factory }>(response)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // PUT /factories/:id - Cập nhật nhà máy
    static async updateFactory(id: string, factoryData: {
        name?: string
        location?: string
        timezone?: string
    }) {
        const response = await api.put(`/factories/${id}`, factoryData)
        // const result = await handleResponse<{ success: boolean; data: Factory }>(response)
        if (response.data.success === false) return [];
        return response.data.data;
    }

    // DELETE /factories/:id - Xóa nhà máy
    static async deleteFactory(id: string) {
        const response = await api.delete(`/factories/${id}`)
        
        if (!response.data.success) {
        throw new Error(`Delete factory failed: ${response.data.error}`)
        }
    }
}

// Building API Service
export class BuildingApiService {
    static async getBuildings() {
        const response = await api.get(`/buildings`);
        return response.data.success ? response.data.data : [];
    }

    static async getBuildingById(id: string) {
        const response = await api.get(`/buildings/${id}`);
        return response.data.success ? response.data.data : null;
    }

    static async getBuildingsByFactory(factoryId: string) {
        const response = await api.get(`/buildings?factoryId=${factoryId}`);
        return response.data.success ? response.data.data : [];
    }

    static async getBuildingsByFactoryIds(factoryIds: string[]) {
        if (factoryIds.length === 0) return this.getBuildings();
        const response = await api.get(`/buildings?factoryIds=${factoryIds.join(',')}`);
        return response.data.success ? response.data.data : [];
    }

    static async createBuilding(buildingData: { name: string; factoryId: string }) {
        const response = await api.post(`/buildings`, buildingData);
        return response.data.data;
    }

    static async updateBuilding(id: string, buildingData: Partial<{ name: string; factoryId: string }>) {
        const response = await api.put(`/buildings/${id}`, buildingData);
        return response.data.data;
    }

    static async deleteBuilding(id: string) {
        await api.delete(`/buildings/${id}`);
    }
}

export class FloorApiService {
    static async getFloors() {
        const response = await api.get(`/floors`);
        return response.data.success ? response.data.data : [];
    }

    static async getFloorById(id: string) {
        const response = await api.get(`/floors/${id}`);
        return response.data.success ? response.data.data : null;
    }

    static async getFloorsByBuilding(buildingId: string) {
        const response = await api.get(`/floors?buildingId=${buildingId}`);
        return response.data.success ? response.data.data : [];
    }

    static async createFloor(floorData: { name: string; buildingId: string }) {
        const response = await api.post(`/floors`, floorData);
        return response.data.data;
    }

    static async updateFloor(id: string, floorData: Partial<{ name: string; buildingId: string }>) {
        const response = await api.put(`/floors/${id}`, floorData);
        return response.data.data;
    }

    static async deleteFloor(id: string) {
        await api.delete(`/floors/${id}`);
    }
}

// ==================== LINE ====================
export class LineApiService {
    static async getLines() {
        const response = await api.get(`/lines`);
        return response.data.success ? response.data.data : [];
    }

    static async getLineById(id: string) {
        const response = await api.get(`/lines/${id}`);
        return response.data.success ? response.data.data : null;
    }

    static async getLinesByFloor(floorId: string) {
        const response = await api.get(`/lines?floorId=${floorId}`);
        return response.data.success ? response.data.data : [];
    }

    static async createLine(lineData: { name: string; floorId: string }) {
        const response = await api.post(`/lines`, lineData);
        return response.data.data;
    }

    static async updateLine(id: string, lineData: Partial<{ name: string; floorId: string }>) {
        const response = await api.put(`/lines/${id}`, lineData);
        return response.data.data;
    }

    static async deleteLine(id: string) {
        await api.delete(`/lines/${id}`);
    }
}

// ==================== ALERT ====================
export class AlertApiService {
    static async getAlerts(filters?: any) {
        const params = new URLSearchParams();
        if (filters) {
        Object.entries(filters).forEach(([k, v]) => v != null && params.append(k, String(v)));
        }
        const response = await api.get(`/alerts?${params.toString()}`);
        return response.data;
    }

    static async getAlertsActive() {
        const response = await api.get(`/alerts/active`);
        return response.data.success ? response.data.data : [];
    }

    static async confirmAcknowledgeAlert(alertId: string, user: { userId: string; acknowledgmentNote: string }) {
        await api.put(`/alerts/${alertId}/acknowledge`, user);
    }

    static async confirmResolveAlert(alertId: string) {
        await api.put(`/alerts/${alertId}/resolve`);
    }
}

// ==================== ANALYTICS ====================
export class AnalyticApiService {
  static async getAnalytics() {
    // const params = new URLSearchParams();
    // if (filters) Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const response = await api.get(`/analytics`);
    return response.data.data;
  }

  static async getRankings() {
    const response = await api.get(`/analytics/rankings`);
    return response.data.data;
  }

  static async getReports() {
    const response = await api.get(`/analytics/reports`);
    return response.data.data;
  }
}

// ==================== USER ====================
export class UserApiService {
  static async getUsers(): Promise<User[]> {
    const response = await api.get(`/users`);
    return response.data.data;
  }

  static async getUserById(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  }

  static async createUser(userData: any): Promise<User> {
    const response = await api.post(`/users`, userData);
    return response.data.data;
  }

  static async resetPassword(token: string, userId: string, password: string) {
    await api.post(`/users/reset-password`, { token, userId, newPassword: password });
  }

  static async updateUser(id: string, userData: any) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data;
  }

  static async changePassword(id: string, passwordData: { currentPassword: string; newPassword: string }) {
    await api.put(`/users/${id}/change-password`, passwordData);
  }

  static async updateProfile(id: string, profileData: any) {
    const response = await api.put(`/users/${id}/update-profile`, profileData);
    return response.data.data;
  }

  static async deleteUser(id: string) {
    await api.delete(`/users/${id}`);
  }
}

// ==================== ROLE & PERMISSION ====================
export class RoleApiService {
  static async getRoles() {
    const response = await api.get(`/roles`);
    return response.data.data;
  }

  static async getRoleById(id: string) {
    const response = await api.get(`/roles/${id}`);
    return response.data.data;
  }

  static async createRole(roleData: { name: string; permissions: string[] }) {
    const response = await api.post(`/roles`, roleData);
    return response.data.data;
  }

  static async updateRole(id: string, roleData: { description?: string }) {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data.data;
  }

  static async deleteRole(id: string) {
    await api.delete(`/roles/${id}`);
  }
}

export class PermissionApiService {
  static async getPermissions(): Promise<ApiPermission[]> {
    const response = await api.get(`/permissions`);
    return response.data.data;
  }

  static async updateRolePermissions(roleId: string, permissions: string[]) {
    await api.put(`/permissions/${roleId}`, { permissions });
  }
}

// ==================== CONFIG SERVICES ====================
export class DbConfigApiService {
  static async getDbConfig(): Promise<DbConfig> {
    const response = await api.get(`/db-config/config`);
    return response.data.data;
  }

  static async updateDbConfig(dbConfig: DbConfig) {
    await api.post(`/db-config/config`, dbConfig);
  }

  static async testDbConnection(dbConfig: DbConfig) {
    await api.post(`/db-config/test-temp`, dbConfig);
  }
}

export class SmtpConfigApiService {
  static async getSmtpConfig(): Promise<SmtpConfig> {
    const response = await api.get(`/smtp-config/config`);
    return response.data.data;
  }

  static async updateSmtpConfig(smtpConfig: SmtpConfig) {
    await api.post(`/smtp-config/config`, smtpConfig);
  }

  static async testSmtpConnection(smtpConfig: SmtpConfig) {
    await api.post(`/smtp-config/test-temp`, smtpConfig);
  }
}

export class EnergySettingsApiService {
  static async getEnergySettings(): Promise<EnergySettings> {
    const response = await api.get(`/energy-settings`);
    return response.data.data;
  }

  static async updateEnergySettings(settingsData: any): Promise<EnergySettings> {
    const response = await api.put(`/energy-settings`, settingsData);
    return response.data.data;
  }
}

export class ShiftApiService {
  static async getShifts(): Promise<Shift[]> {
    const response = await api.get(`/shifts`);
    return response.data.data;
  }

  static async saveShifts(shifts: Shift[]): Promise<Shift[]> {
    const response = await api.post(`/shifts/save`, { shifts });
    return response.data.data;
  }
}

export class ReportApiService {
  static async getReports(): Promise<Report[]> {
    const response = await api.get(`/reports`);
    return response.data.data;
  }

  static async createReport(reportData: Report): Promise<Report> {
    const response = await api.post(`/reports`, reportData);
    return response.data.data;
  }

  static async exportReport(id: string, format: 'pdf' | 'excel'): Promise<Blob> {
    const response = await api.get(`/reports/export/${id}?format=${format}`, { responseType: 'blob' });
    return response.data;
  }
}

export class LogApiService {
  static async getAuditLogs(): Promise<AuditLogEntry[]> {
    const response = await api.get(`/logs/audit`);
    return response.data.data;
  }

  static async getConnectionLogs(): Promise<ConnectionLogEntry[]> {
    const response = await api.get(`/logs/connection`);
    return response.data.data;
  }
}

export class BackupApiService {
  static async createBackup(): Promise<Blob> {
    const response = await api.get(`/backup/backup`, { responseType: 'blob' });
    return response.data;
  }

  static async restoreBackup(backupFile: File) {
    const formData = new FormData();
    formData.append('backupFile', backupFile);
    const response = await api.post(`/backup/restore`, formData);
    return response.data;
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
