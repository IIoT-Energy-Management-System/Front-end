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
    // Load saved user from localStorage on initialization
    this.loadUserFromStorage()
  }

  private loadUserFromStorage(): void {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("currentUser")
      const accessToken = localStorage.getItem("accessToken")
      if (savedUser && accessToken) {
        try {
          this.currentUser = JSON.parse(savedUser)
          // Decode token to get permissions
          try {
            const decoded: any = jwtDecode(accessToken)
            if (this.currentUser) {
              this.currentUser.permissions = decoded.permissions || []
            }
          } catch (error) {
            console.error("Failed to decode token:", error)
            if (this.currentUser) {
              this.currentUser.permissions = []
            }
          }
        } catch (error) {
          console.error("Failed to parse saved user:", error)
          localStorage.removeItem("currentUser")
        }
      }
    }
  }

  private saveUserToStorage(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user))
    }
  }

  private removeUserFromStorage(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser")
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
      });

      const data = await response.json();

      if (!response.ok || !data.success || data.error) {
        return { success: false, error: data.error || 'Login failed' };
      }

      // Decode JWT to get permissions
      let permissions: string[] = [];
      try {
        const decoded: any = jwtDecode(data.data.accessToken);
        permissions = decoded.permissions || [];
      } catch (error) {
        console.error('Failed to decode JWT:', error);
      }

      const dataUser = await UserApiService.getUserById(data.data.id);
      // Assuming the API returns user data without role, etc. We can set defaults or fetch more later
      const user: User = {
        id: dataUser.id,
        username: dataUser.username,
        email: dataUser.email,
        roleId: dataUser.roleId, // Need to adjust based on API
        role: dataUser.role, // Default or from API if provided
        permissions: permissions,
        factoryAccess: dataUser.factoryAccess || [],
        buildingAccess: dataUser.buildingAccess || [],
        floorAccess: dataUser.floorAccess || [],
        lineAccess: dataUser.lineAccess || [],
        language: dataUser.language || 'vi',
        timezone: dataUser.timezone || 'UTC',
        isActive: dataUser.isActive || true,
      };

      this.currentUser = user;

      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }

      // Save user to localStorage if rememberMe
      if (rememberMe) {
        this.saveUserToStorage(user);
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, error: 'Network error or server unavailable' };
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
          
          // Update permissions from new token
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
    if (this.currentUser) {
      // Optionally log logout to API if needed
    }
    this.currentUser = null;
    this.removeUserFromStorage();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null
  }

  hasPermission(permission: string): boolean {
    // console.log("check permission: ", this.currentUser?.permissions, permission);
    if (!this.currentUser) return false
    if (this.currentUser.role === "Admin") return true

    // Check permissions from JWT
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
