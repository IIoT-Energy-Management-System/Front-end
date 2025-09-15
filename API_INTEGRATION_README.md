# NOAS IoT Platform - API Integration

## 📋 Tổng quan

Dự án đã được tích hợp với NOAS Backend API theo tài liệu `API_DOCUMENTATION_FOR_FRONTEND.md`. Hệ thống bao gồm:

### 🔧 Cấu trúc API Services

```
lib/
├── api.ts          # Tất cả API services
├── types.ts        # TypeScript interfaces
└── store.ts        # State management

hooks/
└── use-api.ts      # React hooks cho API calls

components/
└── ErrorBoundary.tsx  # Error handling
```

### 🏗️ API Services Đã Triển Khai

1. **SystemApiService** - Health check
2. **FactoryApiService** - Quản lý nhà máy
3. **BuildingApiService** - Quản lý tòa nhà  
4. **FloorApiService** - Quản lý tầng
5. **LineApiService** - Quản lý dây chuyền
6. **DeviceApiService** - Quản lý thiết bị
7. **DeviceDataApiService** - Dữ liệu thiết bị
8. **AlertApiService** - Quản lý cảnh báo
9. **DashboardApiService** - Dashboard data

### 📱 Pages Mới Sử dụng API

- `app/dashboard/page-api.tsx` - Dashboard với real-time data
- `app/devices/page-api.tsx` - Quản lý thiết bị
- `app/alerts/page-api.tsx` - Quản lý cảnh báo
- `app/api-test/page.tsx` - Test API endpoints

## 🚀 Cài Đặt và Chạy

### 1. Cấu hình Environment

Tạo file `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NODE_ENV=development
```

### 2. Khởi động Backend API

Đảm bảo NOAS Backend đang chạy trên port 5000:
```bash
# Backend phải chạy trước
http://localhost:5000/api-docs  # Swagger documentation
```

### 3. Khởi động Frontend

```bash
npm install
npm run dev
```

### 4. Test API Connections

Truy cập: `http://localhost:3000/api-test` để kiểm tra kết nối API

## 🔧 Sử Dụng API

### Basic API Calls

```typescript
import API from '@/lib/api'

// Get dashboard overview
const overview = await API.dashboard.getOverview()

// Get devices with filters
const devices = await API.devices.getDevices({
  factoryId: 'F001',
  status: 'Online',
  limit: 50
})

// Get real-time data
const realTimeData = await API.dashboard.getRealTimeData()
```

### Sử Dụng React Hooks

```typescript
import { useDevices, useDashboardOverview, useRealTimeData } from '@/hooks/use-api'

function MyComponent() {
  // Auto-fetch với loading/error handling
  const { data: devices, loading, error } = useDevices({ status: 'Online' })
  
  // Real-time data với auto-refresh
  const { data: realTimeData } = useRealTimeData(5000) // 5 giây
  
  // Dashboard overview
  const { data: overview } = useDashboardOverview()
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {devices && devices.map(device => <div key={device.id}>{device.name}</div>)}
    </div>
  )
}
```

### Error Handling

```typescript
import { ErrorBoundary, ApiErrorFallback } from '@/components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary fallback={ApiErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

## 📊 API Endpoints Chính

### Dashboard APIs
- `GET /api/dashboard/overview` - Tổng quan hệ thống
- `GET /api/dashboard/real-time` - Dữ liệu real-time
- `GET /api/dashboard/factory/{id}` - Dashboard theo nhà máy

### Device APIs  
- `GET /api/devices/stats` - Thống kê thiết bị
- `GET /api/devices` - Danh sách thiết bị (có filter)
- `POST /api/devices` - Tạo thiết bị mới
- `GET /api/device-data/{id}/data/latest` - Dữ liệu mới nhất

### Alert APIs
- `GET /api/alerts/active` - Cảnh báo đang hoạt động  
- `GET /api/alerts/stats` - Thống kê cảnh báo
- `PUT /api/alerts/{id}` - Xử lý cảnh báo

### Hierarchy APIs
- `GET /api/factories` - Danh sách nhà máy
- `GET /api/factories/{id}/buildings` - Tòa nhà của nhà máy
- `GET /api/buildings/{id}/floors` - Tầng của tòa nhà
- `GET /api/floors/{id}/lines` - Dây chuyền của tầng

## 🎯 Tính Năng Chính

### ✅ Dashboard Real-time
- Hiển thị thống kê tổng quan
- Auto-refresh dữ liệu real-time 
- Trạng thái thiết bị live
- Cảnh báo mới nhất

### ✅ Quản Lý Thiết Bị
- Danh sách thiết bị với filter
- Tạo thiết bị mới
- Theo dõi trạng thái real-time
- Phân cấp theo Factory/Building/Floor/Line

### ✅ Quản Lý Cảnh Báo  
- Hiển thị cảnh báo theo mức độ
- Xử lý cảnh báo (acknowledge/resolve)
- Filter theo trạng thái và thiết bị
- Thống kê cảnh báo

### ✅ Error Handling
- Error boundary cho toàn ứng dụng
- Retry mechanism cho API calls
- Loading states
- Network error detection

### ✅ TypeScript Support
- Type-safe API calls
- Interface definitions
- Auto-completion
- Error catching at compile time

## 🔄 Real-time Features

### Polling Data
```typescript
// Auto-refresh mỗi 5 giây
const { data } = useRealTimeData(5000)

// Polling custom data
const { data } = usePolling(() => API.devices.getDeviceStats(), 30000)
```

### Manual Refresh
```typescript
const { data, refetch } = useDevices()

// Manual refresh
<Button onClick={refetch}>Refresh</Button>
```

## 🛠️ Development

### Thêm API Endpoint Mới

1. **Thêm vào API service:**
```typescript
// lib/api.ts
export class NewApiService {
  static async newMethod(): Promise<ResponseType> {
    const response = await fetch(buildUrl('/new-endpoint'))
    return handleResponse(response)
  }
}

// Thêm vào API object
export const API = {
  // ...existing services
  newService: NewApiService
}
```

2. **Tạo hook:**
```typescript
// hooks/use-api.ts
export function useNewData() {
  return useApiData(() => API.newService.newMethod())
}
```

3. **Sử dụng trong component:**
```typescript
const { data, loading, error } = useNewData()
```

### Debug API Calls

1. **Kiểm tra Network tab** trong DevTools
2. **Sử dụng API Test page** `/api-test`
3. **Check console logs** cho API errors
4. **Verify environment variables**

## 📝 Notes

### Backend Requirements
- Backend phải chạy trên `http://localhost:5000`
- CORS đã được enable cho `http://localhost:3000`
- Swagger docs: `http://localhost:5000/api-docs`

### Environment Variables
- `NEXT_PUBLIC_API_BASE_URL` - Base URL cho API
- `NODE_ENV` - Environment mode

### Troubleshooting
1. **API connection errors**: Kiểm tra backend có chạy không
2. **CORS errors**: Verify CORS config trong backend
3. **Type errors**: Check interface definitions trong `types.ts`
4. **Loading states**: Sử dụng loading indicators

## 🔮 Next Steps

1. **WebSocket Integration** - Real-time updates thay vì polling
2. **Cache Management** - Implement React Query hoặc SWR
3. **Offline Support** - Service worker cho offline functionality
4. **Performance Optimization** - Lazy loading, pagination
5. **Testing** - Unit tests cho API services và hooks

---

🎉 **API Integration hoàn tất!** Dự án đã sẵn sàng để kết nối với NOAS Backend và hiển thị dữ liệu real-time.
