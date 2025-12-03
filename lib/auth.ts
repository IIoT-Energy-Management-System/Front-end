import { jwtDecode } from 'jwt-decode'
import {api} from './api'
import type { User } from "./types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

class AuthService {
  private currentUser: User | null = null

  async login(email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; user?: User; accessToken?: string; error?: string }> {
    try {
      const response = await api.post('/users/login', { email, password })
      const data = response.data

      if (!data.success || data.error) {
        return { success: false, error: data.error || 'Login failed' }
      }

      // Decode JWT để lấy permissions
      let permissions: string[] = []
      try {
        const decoded: any = jwtDecode(data.data.accessToken)
        permissions = decoded.permissions || []
      } catch (error) {
        console.error('Failed to decode JWT:', error)
      }

      // Fetch full user từ API
      const userResponse = await api.get(`/users/${data.data.id}`)
      const dataUser = userResponse.data.data
      
      const user: User = {
        id: dataUser.id,
        username: dataUser.username,
        email: dataUser.email,
        roleId: dataUser.roleId,
        role: dataUser.role,
        permissions,
        factoryAccess: dataUser.factoryAccess || [],
        buildingAccess: dataUser.buildingAccess || [],
        floorAccess: dataUser.floorAccess || [],
        lineAccess: dataUser.lineAccess || [],
        language: dataUser.language || 'vi',
        timezone: dataUser.timezone || 'UTC',
        isActive: dataUser.isActive || true,
      }

      this.currentUser = user

      // accessToken sẽ được lưu vào store bởi caller (store.login)
      // refreshToken đã được lưu trong httpOnly cookie

      return { success: true, user, accessToken: data.data.accessToken }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Network error or server unavailable' 
      }
    }
  }

  async fetchCurrentUser(token: string): Promise<User | null> {
    if (!token) {
      await this.logout()
      return null
    }

    try {
      // Decode token để lấy user ID
      const decoded: any = jwtDecode(token)
      const userId = decoded.sub || decoded.id // Adjust theo token structure

      if (!userId) {
        throw new Error('No user ID in token')
      }

      // Fetch full user từ server
      const response = await api.get(`/users/${userId}`)
      const fullUser = response.data.data
      fullUser.permissions = decoded.permissions || []
      this.currentUser = fullUser
      return fullUser
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      await this.logout()
      return null
    }
  }

  async refreshToken(): Promise<{ success: boolean; accessToken?: string }> {
    try {
      // refreshToken được tự động gửi qua cookie
      const response = await api.post('/users/refresh')

      if (response.data.success && response.data.data.accessToken) {
        const newToken = response.data.data.accessToken
        try {
          const decoded: any = jwtDecode(newToken)
          if (this.currentUser) {
            this.currentUser.permissions = decoded.permissions || []
          }
        } catch (error) {
          console.error('Failed to decode refreshed token:', error)
        }
        return { success: true, accessToken: newToken }
      }
      return { success: false }
    } catch (error) {
      console.error('Token refresh failed:', error)
      return { success: false }
    }
  }

  async logout(): Promise<void> {
    try {
      // Gọi API logout để xóa refreshToken cookie
      await api.post('/users/logout')
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      // Dù API có lỗi hay không, vẫn clear local state
      this.currentUser = null
      // Store sẽ clear accessToken
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false
    if (this.currentUser.role === "Admin") return true
    return this.currentUser.permissions?.includes(permission) || false
  }

  setPermissionsFromToken(token: string): void {
    if (!this.currentUser) return
    try {
      const decoded: any = jwtDecode(token)
      this.currentUser.permissions = decoded.permissions || []
    } catch (error) {
      console.error("Failed to decode token:", error)
      this.currentUser.permissions = []
    }
  }
}

export const authService = new AuthService()