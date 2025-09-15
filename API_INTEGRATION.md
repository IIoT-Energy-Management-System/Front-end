# API Integration Guide

## Overview
Project đã được tích hợp với backend API tại `localhost:5000`. Frontend sẽ gọi các API thực tế thay vì sử dụng database giả lập.

## API Endpoints được tích hợp

### Device APIs
- `GET /api/devices` - Lấy danh sách thiết bị (có filter)
- `GET /api/devices/:id` - Lấy chi tiết thiết bị
- `GET /api/lines/:lineId/devices` - Lấy thiết bị theo chuyền
- `POST /api/devices` - Thêm thiết bị mới
- `PUT /api/devices/:id` - Cập nhật thiết bị
- `DELETE /api/devices/:id` - Xóa thiết bị
- `PUT /api/devices/:id/status` - Cập nhật trạng thái thiết bị
- `PUT /api/devices/:id/position` - Cập nhật vị trí thiết bị

## Files đã được cập nhật

### 1. `lib/api.ts` (Mới)
- Service class `DeviceApiService` chứa tất cả các hàm gọi API
- Hook `useDeviceApi()` để sử dụng trong React components
- Error handling cho các API calls

### 2. `app/devices/page.tsx` (Đã cập nhật)
- Thay thế `db` bằng API calls từ `useDeviceApi()`
- Thêm loading state khi gọi API
- Thêm error handling
- Cải thiện UX với loading spinner và empty states
- Thêm dropdown để thay đổi status thiết bị trực tiếp

## Cách sử dụng

### Khởi động backend
Đảm bảo backend API đang chạy tại `http://localhost:5000`

### Chạy frontend
```bash
npm run dev
# hoặc
pnpm dev
```

### Test API integration
1. Vào trang `/devices`
2. Thử các chức năng:
   - Xem danh sách thiết bị
   - Thêm thiết bị mới
   - Xóa thiết bị
   - Thay đổi trạng thái thiết bị

## Error Handling
- Nếu API server không khả dụng, frontend sẽ hiển thị empty state
- Errors được log ra console để debug
- UI sẽ hiển thị loading state trong khi gọi API

## Mở rộng thêm API

Để thêm API mới:

1. Thêm method vào `DeviceApiService` trong `lib/api.ts`
2. Export method qua `useDeviceApi()` hook
3. Sử dụng trong component tương ứng

Ví dụ:
```typescript
// Trong lib/api.ts
static async getDeviceData(deviceId: string): Promise<DeviceData[]> {
  const response = await fetch(`${API_BASE_URL}/api/devices/${deviceId}/data`)
  return handleResponse<DeviceData[]>(response)
}

// Trong useDeviceApi hook
export function useDeviceApi() {
  return {
    // ...existing methods
    getDeviceData: DeviceApiService.getDeviceData,
  }
}
```

## Cấu trúc dữ liệu

Tất cả các API cần tuân thủ interface định nghĩa trong `lib/types.ts`:
- `Device`
- `DeviceData` 
- `Factory`, `Building`, `Floor`, `Line`
- Etc.

## Notes
- API base URL có thể được config thông qua environment variable
- CORS cần được cấu hình đúng ở backend để cho phép frontend gọi API
- Cần implement authentication headers nếu API yêu cầu
