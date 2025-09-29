import { create } from "zustand"
import { authService } from "./auth"
// import { db } from "./database"
import type { Alert, Device, DeviceData, Factory, SystemSettings, User } from "./types"
// import { User } from "lucide-react"

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean

  // Data
  factories: Factory[]
  devices: Device[]
  deviceData: Map<string, DeviceData[]>
  alerts: Alert[]
  settings: SystemSettings | null

  // UI State
  selectedFactory: string | null
  selectedBuilding: string | null
  selectedFloor: string | null
  selectedLine: string | null
  language: "en" | "vi"

  // Loading states
  isLoading: boolean

  isCheckingAuth: boolean // Thêm trạng thái để theo dõi việc kiểm tra xác thực
  // Actions
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => void
  setUser: (user: User | null) => void
  checkAuthStatus: () => void
  setSelectedFactory: (id: string | null) => void
  setSelectedBuilding: (id: string | null) => void
  setSelectedFloor: (id: string | null) => void
  setSelectedLine: (id: string | null) => void
  setLanguage: (lang: "en" | "vi") => void
  updateDeviceData: (deviceId: string, data: DeviceData) => void
  addAlert: (alert: Alert) => void
  setIsCheckingAuth: (checking: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  factories: [],
  devices: [],
  deviceData: new Map(),
  alerts: [],
  settings: null,
  selectedFactory: null,
  selectedBuilding: null,
  selectedFloor: null,
  selectedLine: null,
  language: "vi",
  isLoading: false,
  isCheckingAuth: true,

  // Actions
  login: async (email: string, password: string, rememberMe: boolean = false) => {
    set({ isLoading: true })
    const result = await authService.login(email, password, rememberMe)
    if (result.success && result.user) {
      set({
        user: result.user,
        isAuthenticated: true,
        language: result.user.language,
        isLoading: false,
      })
      return true
    }
    set({ isLoading: false })
    return false
  },

  logout: () => {
    authService.logout()
    set({
      user: null,
      isAuthenticated: false,
      selectedFactory: null,
      selectedBuilding: null,
      selectedFloor: null,
      selectedLine: null,
      isCheckingAuth: false,
    })
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user })
  },

  checkAuthStatus: () => {
    set({ isCheckingAuth: true })
    const currentUser = authService.getCurrentUser()
    console.log("checkAuthStatus: currentUser =", currentUser)
    if (currentUser) {
      set({
        user: currentUser,
        isAuthenticated: true,
        language: currentUser.language,
        isCheckingAuth: false,
      })
    } else {
      set({
        user: null,
        isAuthenticated: false,
        isCheckingAuth: false,
      })
    }
  },

    setIsCheckingAuth: (checking: boolean) => {
        set({ isCheckingAuth: checking })
    },

  setSelectedFactory: (id: string | null) => {
    set({
      selectedFactory: id,
      selectedBuilding: null,
      selectedFloor: null,
      selectedLine: null,
    })
  },

  setSelectedBuilding: (id: string | null) => {
    set({
      selectedBuilding: id,
      selectedFloor: null,
      selectedLine: null,
    })
  },

  setSelectedFloor: (id: string | null) => {
    set({
      selectedFloor: id,
      selectedLine: null,
    })
  },

  setSelectedLine: (id: string | null) => {
    set({ selectedLine: id })
  },

  setLanguage: (lang: "en" | "vi") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang)
    }
    set({ language: lang })
  },

  updateDeviceData: (deviceId: string, data: DeviceData) => {
    const { deviceData } = get()
    const newDeviceData = new Map(deviceData)
    const existing = newDeviceData.get(deviceId) || []
    existing.push(data)
    // Keep only last 100 data points per device
    if (existing.length > 100) {
      existing.splice(0, existing.length - 100)
    }
    newDeviceData.set(deviceId, existing)
    set({ deviceData: newDeviceData })
  },

  addAlert: (alert: Alert) => {
    const { alerts } = get()
    set({ alerts: [alert, ...alerts].slice(0, 100) })
  },
}))
