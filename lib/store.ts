import { create } from "zustand"
import { persist } from "zustand/middleware"
import { UserApiService } from "./api"
import { authService } from "./auth"
import type { Alert, Device, DeviceData, Factory, SystemSettings, User } from "./types"

interface AppState {
  accessToken: string | null
  user: User | null
  isAuthenticated: boolean
  factories: Factory[]
  devices: Device[]
  deviceData: Map<string, DeviceData[]>
  alerts: Alert[]
  settings: SystemSettings | null
  selectedFactory: string | null
  selectedBuilding: string | null
  selectedFloor: string | null
  selectedLine: string | null
  language: "en" | "vi"
  isLoading: boolean
  isCheckingAuth: boolean
  setAccessToken: (token: string | null) => void
  clearState: () => void
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  checkAuthStatus: () => Promise<void>
  fetchMe: () => Promise<void>
  refresh: () => Promise<void>
  setSelectedFactory: (id: string | null) => void
  setSelectedBuilding: (id: string | null) => void
  setSelectedFloor: (id: string | null) => void
  setSelectedLine: (id: string | null) => void
  setLanguage: (lang: "en" | "vi") => void
  updateDeviceData: (deviceId: string, data: DeviceData) => void
  addAlert: (alert: Alert) => void
  updateUser: (userData: Partial<User>) => void
  setIsCheckingAuth: (checking: boolean) => void
}

// Custom storage để serialize Map
const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name)
    if (!str) return null
    const { state } = JSON.parse(str)
    // Convert deviceData từ array về Map
    if (state.deviceData && Array.isArray(state.deviceData)) {
      state.deviceData = new Map(state.deviceData)
    }
    return { state }
  },
  setItem: (name: string, value: any) => {
    const { state } = value
    // Convert Map sang array để serialize
    if (state.deviceData instanceof Map) {
      state.deviceData = Array.from(state.deviceData.entries())
    }
    localStorage.setItem(name, JSON.stringify({ state }))
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
  },
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  accessToken: null,
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

  setAccessToken: (token: string | null) => {
    set({ accessToken: token })
  },

  clearState: () => {
    set({ 
      accessToken: null, 
      user: null, 
      isAuthenticated: false,
      isLoading: false 
    })
  },

  login: async (email: string, password: string, rememberMe: boolean = false) => {
    set({ isLoading: true })
    const result = await authService.login(email, password, rememberMe)
    if (result.success && result.user && result.accessToken) {
      set({
        accessToken: result.accessToken,
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

  logout: async () => {
    await authService.logout()
    get().clearState()
    set({
      selectedFactory: null,
      selectedBuilding: null,
      selectedFloor: null,
      selectedLine: null,
      isCheckingAuth: false,
    })
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true })
      const { accessToken } = get()
      if (!accessToken) {
        get().clearState()
        return
      }
      const user = await authService.fetchCurrentUser(accessToken)
      if (user) {
        set({ user, isAuthenticated: true })
      } else {
        get().clearState()
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      get().clearState()
    } finally {
      set({ isLoading: false })
    }
  },

  refresh: async () => {
    try {
      set({ isLoading: true })
      const result = await authService.refreshToken()
      if (result.success && result.accessToken) {
        set({ accessToken: result.accessToken })
        
        // Nếu chưa có user, fetch user
        if (!get().user) {
          await get().fetchMe()
        }
      } else {
        get().clearState()
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      get().clearState()
    } finally {
      set({ isLoading: false })
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user })
  },

  checkAuthStatus: async () => {
    set({ isCheckingAuth: true })
    const { accessToken } = get()
    
    if (accessToken) {
      await get().fetchMe()
    } else {
      // Thử refresh nếu không có accessToken
      await get().refresh()
    }
    set({ isCheckingAuth: false })
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

  setLanguage: async (lang: "en" | "vi") => {
    if (typeof window !== "undefined") {
      try {
        const user = authService.getCurrentUser()
        if (!user || !user.id) return
        await UserApiService.updateProfile(user.id, { language: lang })
      } catch (error) {
        console.error("Error saving language:", error)
      }
    }
    set({ language: lang })
  },

  updateDeviceData: (deviceId: string, data: DeviceData) => {
    const { deviceData } = get()
    const newDeviceData = new Map(deviceData)
    const existing = newDeviceData.get(deviceId) || []
    existing.push(data)
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

  updateUser: (userData: Partial<User>) => {
    const { user } = get()
    if (user) {
      set({ user: { ...user, ...userData } })
    }
    set({ language: userData.language || get().language})
  },
    }),
    {
      name: 'app-storage', // Tên key trong localStorage
      storage: customStorage,
      // Chỉ persist những field cần thiết
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
      }),
    }
  )
)