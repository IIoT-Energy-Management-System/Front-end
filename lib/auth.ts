import { db } from "./database"
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
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser)
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

  async login(username: string, password: string, rememberMe: boolean = false): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Simulate authentication - in real app, this would validate against database
      const users = await db.getUsers()
      const user = users.find((u) => u.username === username && u.isActive)

      if (!user) {
        return { success: false, error: "Invalid credentials" }
      }

      // In real app, verify password hash
      if (password !== "admin123") {
        return { success: false, error: "Invalid credentials" }
      }

      this.currentUser = user

      // Save to localStorage if rememberMe is true
      if (rememberMe) {
        this.saveUserToStorage(user)
      }

      // Log authentication
      await db.addAuditLog({
        userId: user.id,
        username: user.username,
        action: "LOGIN",
        resource: "AUTH",
        timestamp: new Date().toISOString(),
        ipAddress: "127.0.0.1",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      })

      return { success: true, user }
    } catch (error) {
      return { success: false, error: "Authentication failed" }
    }
  }

  async logout(): Promise<void> {
    if (this.currentUser) {
      await db.addAuditLog({
        userId: this.currentUser.id,
        username: this.currentUser.username,
        action: "LOGOUT",
        resource: "AUTH",
        timestamp: new Date().toISOString(),
        ipAddress: "127.0.0.1",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
      })
    }
    this.currentUser = null
    this.removeUserFromStorage()
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null
  }

  hasPermission(resource: string, action: string): boolean {
    if (!this.currentUser) return false
    if (this.currentUser.role === "Admin") return true

    // Implement role-based permissions
    const permissions = {
      Supervisor: ["read", "update"],
      Operator: ["read"],
      Viewer: ["read"],
    }

    return permissions[this.currentUser.role]?.includes(action) || false
  }
}

export const authService = new AuthService()
