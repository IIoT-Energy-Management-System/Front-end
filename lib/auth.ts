import { jwtDecode } from 'jwt-decode'
import { UserApiService } from './api'
import type { User } from "./types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

class AuthService {
  private currentUser: User | null = null

  constructor() {
    // Load basic user info từ localStorage khi khởi tạo
    this.loadBasicUserFromStorage()
  }

  private loadBasicUserFromStorage(): Partial<User> | null {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("currentUserBasic")
      if (savedUser) {
        try {
          return JSON.parse(savedUser)
        } catch (error) {
          console.error("Failed to parse basic user:", error)
          localStorage.removeItem("currentUserBasic")
        }
      }
    }
    return null
  }

  private saveUserToStorage(basicUser: Partial<User>): void {
    if (typeof window !== "undefined") {
      // Chỉ lưu các field cơ bản, không lưu permissions/role/access
      const safeUser = {
        id: basicUser.id,
        username: basicUser.username,
        email: basicUser.email,
        language: basicUser.language || 'vi',
        timezone: basicUser.timezone || 'UTC',
      }
      localStorage.setItem("currentUserBasic", JSON.stringify(safeUser))
    }
  }

  private removeUserFromStorage(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUserBasic")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
    }
  }

  async login(email: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success || data.error) {
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
      const dataUser = await UserApiService.getUserById(data.data.id)
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

      // Lưu tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
      }

      // Lưu basic user nếu rememberMe
      if (rememberMe) {
        this.saveUserToStorage(user)
      }

      return { success: true, user }
    } catch (error) {
      return { success: false, error: 'Network error or server unavailable' }
    }
  }

  async fetchCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('accessToken')
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
      const fullUser = await UserApiService.getUserById(userId)
      fullUser.permissions = decoded.permissions || []
      this.currentUser = fullUser
      return fullUser
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      await this.logout()
      return null
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) return false

      const response = await fetch('http://localhost:5000/api/users/refresh', {
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
          try {
            const decoded: any = jwtDecode(data.data.accessToken)
            if (this.currentUser) {
              this.currentUser.permissions = decoded.permissions || []
            }
          } catch (error) {
            console.error('Failed to decode refreshed token:', error)
          }
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null
    this.removeUserFromStorage()
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