# NOAS Backend API Documentation for Frontend

## Base Information
- **Base URL:** `http://localhost:5000/api`
- **Swagger Documentation:** `http://localhost:5000/api-docs`
- **Server Port:** 5000
- **CORS Enabled:** Yes (for http://localhost:3000)
- **Content-Type:** application/json

---

## 1. SYSTEM APIs

### Health Check
```http
GET /api/health
```

**Response Example:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-08-19T10:30:00.000Z",
  "version": "1.0.0"
}
```

**Usage (JavaScript):**
```javascript
const checkHealth = async () => {
  const response = await fetch('http://localhost:5000/api/health');
  const data = await response.json();
  console.log('API Status:', data.message);
};
```

---

## 2. FACTORY APIs

### Get All Factories
```http
GET /api/factories
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "F001",
      "name": "Factory A",
      "location": "Hanoi, Vietnam",
      "timezone": "Asia/Ho_Chi_Minh",
      "createdAt": "2025-08-01T00:00:00.000Z",
      "updatedAt": "2025-08-01T00:00:00.000Z"
    }
  ]
}
```

### Create Factory
```http
POST /api/factories
```

**Request Body:**
```json
{
  "name": "New Factory",
  "location": "Ho Chi Minh City, Vietnam",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "F002",
    "name": "New Factory",
    "location": "Ho Chi Minh City, Vietnam",
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

### Get Factory Buildings
```http
GET /api/factories/{factoryId}/buildings
```

**Usage:**
```javascript
const getFactoryBuildings = async (factoryId) => {
  const response = await fetch(`http://localhost:5000/api/factories/${factoryId}/buildings`);
  return await response.json();
};
```

---

## 3. BUILDING APIs

### Get All Buildings
```http
GET /api/buildings
```

### Create Building
```http
POST /api/buildings
```

**Request Body:**
```json
{
  "name": "Building A",
  "factoryId": "F001",
  "description": "Main production building"
}
```

### Get Building Floors
```http
GET /api/buildings/{buildingId}/floors
```

---

## 4. FLOOR APIs

### Get All Floors
```http
GET /api/floors
```

### Get Floor Lines
```http
GET /api/floors/{floorId}/lines
```

---

## 5. LINE APIs

### Get All Lines
```http
GET /api/lines
```

### Get Line Devices
```http
GET /api/lines/{lineId}/devices
```

---

## 6. DEVICE APIs

### Get Device Statistics
```http
GET /api/devices/stats
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "online": 120,
    "offline": 20,
    "maintenance": 10
  }
}
```

### Get All Devices (with filters)
```http
GET /api/devices?factoryId=F001&buildingId=B001&status=Online&limit=50
```

**Query Parameters:**
- `factoryId` (optional): Filter by factory ID
- `buildingId` (optional): Filter by building ID
- `floorId` (optional): Filter by floor ID
- `lineId` (optional): Filter by line ID
- `status` (optional): Online, Offline, Maintenance, Error
- `limit` (optional): Number of results

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "D001",
      "name": "Motor A1",
      "type": "Motor",
      "status": "Online",
      "factoryId": "F001",
      "buildingId": "B001",
      "floorId": "FL001",
      "lineId": "L001",
      "lastSeen": "2025-08-19T10:25:00.000Z",
      "createdAt": "2025-08-01T00:00:00.000Z"
    }
  ]
}
```

### Create Device
```http
POST /api/devices
```

**Request Body:**
```json
{
  "name": "New Motor",
  "type": "Motor",
  "factoryId": "F001",
  "buildingId": "B001",
  "floorId": "FL001",
  "lineId": "L001"
}
```

**Usage Example:**
```javascript
const createDevice = async (deviceData) => {
  const response = await fetch('http://localhost:5000/api/devices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deviceData)
  });
  return await response.json();
};

// Example usage
const newDevice = {
  name: "Conveyor Belt 01",
  type: "Conveyor",
  factoryId: "F001",
  buildingId: "B001", 
  floorId: "FL001",
  lineId: "L001"
};

createDevice(newDevice).then(result => {
  console.log('Device created:', result);
});
```

---

## 7. DEVICE DATA APIs

### Get Device Data
```http
GET /api/device-data/{deviceId}/data?startDate=2025-08-01&endDate=2025-08-19&limit=100
```

**Query Parameters:**
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format) 
- `limit` (optional): Number of records (default: 100)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "DD001",
      "deviceId": "D001",
      "timestamp": "2025-08-19T10:20:00.000Z",
      "power": 1500.5,
      "voltage": 220.0,
      "current": 6.82,
      "powerFactor": 0.95,
      "status": "Online",
      "temperature": 45.2,
      "vibration": 0.3
    }
  ]
}
```

### Record Device Data
```http
POST /api/device-data/{deviceId}/data
```

**Request Body:**
```json
{
  "power": 1500.5,
  "voltage": 220.0,
  "current": 6.82,
  "powerFactor": 0.95,
  "status": "Online",
  "temperature": 45.2,
  "vibration": 0.3
}
```

### Get Latest Device Data
```http
GET /api/device-data/{deviceId}/data/latest
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "deviceId": "D001",
    "timestamp": "2025-08-19T10:25:00.000Z",
    "power": 1502.1,
    "voltage": 221.5,
    "current": 6.79,
    "powerFactor": 0.96,
    "status": "Online",
    "temperature": 44.8,
    "vibration": 0.25
  }
}
```

### Get Device Data Statistics
```http
GET /api/device-data/{deviceId}/data/statistics
```

**Usage Example:**
```javascript
const getDeviceData = async (deviceId, options = {}) => {
  const params = new URLSearchParams();
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.limit) params.append('limit', options.limit);
  
  const url = `http://localhost:5000/api/device-data/${deviceId}/data?${params}`;
  const response = await fetch(url);
  return await response.json();
};

// Usage
getDeviceData('D001', {
  startDate: '2025-08-18T00:00:00.000Z',
  endDate: '2025-08-19T23:59:59.000Z',
  limit: 50
}).then(data => {
  console.log('Device data:', data);
});
```

---

## 8. ALERT APIs

### Get All Alerts (with filters)
```http
GET /api/alerts?deviceId=D001&severity=High&status=active&limit=50
```

**Query Parameters:**
- `deviceId` (optional): Filter by device ID
- `severity` (optional): Low, Medium, High, Critical
- `status` (optional): active, acknowledged, resolved
- `limit` (optional): Number of results (default: 50)

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "A001",
      "deviceId": "D001",
      "type": "temperature",
      "severity": "High",
      "message": "Temperature exceeds 50°C threshold",
      "status": "active",
      "createdAt": "2025-08-19T10:15:00.000Z",
      "acknowledgedAt": null,
      "resolvedAt": null
    }
  ]
}
```

### Create Alert
```http
POST /api/alerts
```

**Request Body:**
```json
{
  "deviceId": "D001",
  "type": "temperature",
  "severity": "High",
  "message": "Temperature exceeds threshold"
}
```

### Get Active Alerts
```http
GET /api/alerts/active
```

### Get Alert Statistics
```http
GET /api/alerts/stats
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "active": 5,
    "acknowledged": 8,
    "resolved": 12,
    "bySeverity": {
      "Critical": 2,
      "High": 8,
      "Medium": 10,
      "Low": 5
    }
  }
}
```

### Get Alert by ID
```http
GET /api/alerts/{id}
```

### Update Alert Status
```http
PUT /api/alerts/{id}
```

**Request Body:**
```json
{
  "status": "acknowledged"
}
```

**Usage Example:**
```javascript
const getActiveAlerts = async () => {
  const response = await fetch('http://localhost:5000/api/alerts/active');
  const data = await response.json();
  return data.data;
};

const createAlert = async (alertData) => {
  const response = await fetch('http://localhost:5000/api/alerts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(alertData)
  });
  return await response.json();
};

const acknowledgeAlert = async (alertId) => {
  const response = await fetch(`http://localhost:5000/api/alerts/${alertId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'acknowledged' })
  });
  return await response.json();
};
```

---

## 9. DASHBOARD APIs

### Get Dashboard Overview
```http
GET /api/dashboard/overview
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "factories": {
      "total": 3,
      "active": 3
    },
    "devices": {
      "total": 150,
      "online": 120,
      "offline": 20,
      "maintenance": 10
    },
    "alerts": {
      "active": 5,
      "critical": 2,
      "high": 8
    },
    "energy": {
      "totalConsumption": 12500.5,
      "averagePowerFactor": 0.94
    }
  }
}
```

### Get Factory Dashboard
```http
GET /api/dashboard/factory/{factoryId}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "factoryInfo": {
      "id": "F001",
      "name": "Factory A",
      "location": "Hanoi"
    },
    "devices": {
      "total": 50,
      "online": 42,
      "offline": 5,
      "maintenance": 3
    },
    "production": {
      "efficiency": 94.5,
      "uptime": 98.2
    }
  }
}
```

### Get Real-time Dashboard Data
```http
GET /api/dashboard/real-time
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-08-19T10:30:00.000Z",
    "devices": {
      "onlineCount": 120,
      "totalPower": 85000.5,
      "averageTemperature": 42.5
    },
    "alerts": {
      "newCount": 2,
      "criticalCount": 1
    }
  }
}
```

---

## COMPLETE USAGE EXAMPLES

### React Hook for Devices
```javascript
import { useState, useEffect } from 'react';

const useDevices = (filters = {}) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams(filters);
        const response = await fetch(`http://localhost:5000/api/devices?${params}`);
        const data = await response.json();
        
        if (data.success) {
          setDevices(data.data);
        } else {
          setError('Failed to fetch devices');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [JSON.stringify(filters)]);

  return { devices, loading, error };
};

// Usage in component
const DeviceList = () => {
  const { devices, loading, error } = useDevices({ 
    status: 'Online', 
    factoryId: 'F001' 
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {devices.map(device => (
        <li key={device.id}>{device.name} - {device.status}</li>
      ))}
    </ul>
  );
};
```

### Real-time Data Hook
```javascript
const useRealTimeData = (interval = 5000) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/real-time');
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
      }
    };

    // Initial fetch
    fetchData();

    // Set up interval
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return data;
};
```

### Device Data Chart Component
```javascript
const DeviceChart = ({ deviceId }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const response = await fetch(
        `http://localhost:5000/api/device-data/${deviceId}/data?` +
        `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=100`
      );
      
      const data = await response.json();
      if (data.success) {
        setChartData(data.data);
      }
    };

    if (deviceId) {
      fetchChartData();
    }
  }, [deviceId]);

  return (
    <div>
      {/* Render chart with chartData */}
    </div>
  );
};
```

### Alert Management Service
```javascript
class AlertService {
  static baseUrl = 'http://localhost:5000/api/alerts';

  static async getAlerts(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseUrl}?${params}`);
    return await response.json();
  }

  static async createAlert(alertData) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
    return await response.json();
  }

  static async acknowledgeAlert(alertId) {
    const response = await fetch(`${this.baseUrl}/${alertId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'acknowledged' })
    });
    return await response.json();
  }

  static async getStats() {
    const response = await fetch(`${this.baseUrl}/stats`);
    return await response.json();
  }
}
```

---

## ERROR HANDLING

All APIs return responses in this format:
```json
{
  "success": boolean,
  "data": any,         // Present on success
  "error": string,     // Present on error
  "message": string    // Present on error
}
```

**Error Response Example:**
```json
{
  "success": false,
  "error": "Device not found",
  "message": "Device with ID D999 does not exist"
}
```

**Frontend Error Handling:**
```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const response = await apiFunction();
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || response.error);
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

---

## NOTES FOR FRONTEND DEVELOPERS

1. **Base URL**: Make sure to configure the base URL as an environment variable
2. **CORS**: The backend is configured to accept requests from `http://localhost:3000`
3. **Real-time Updates**: Consider using WebSocket or polling for real-time data
4. **Caching**: Implement caching for static data like factory/building hierarchy
5. **Error Handling**: Always check the `success` field in responses
6. **Date Formats**: Use ISO 8601 format for dates (YYYY-MM-DDTHH:mm:ss.sssZ)
7. **Pagination**: Use `limit` parameter for large datasets
8. **Filtering**: Combine multiple query parameters for complex filtering

## SWAGGER DOCUMENTATION

For interactive API testing and more detailed documentation, visit:
`http://localhost:5000/api-docs`
