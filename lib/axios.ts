import axios from "axios"
import { useAppStore } from "./store"

const api = axios.create({
  baseURL: process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api",
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

export default api
