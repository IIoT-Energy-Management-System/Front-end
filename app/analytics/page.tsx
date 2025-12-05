"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticApiService, BASE_API_URL, BuildingApiService, DeviceApiService, FactoryApiService, FloorApiService, LineApiService } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import {
    AlertTriangle,
    BarChart3,
    Building2,
    ChevronRight,
    Download,
    Factory,
    Home,
    Layers,
    Leaf,
    Search,
    Zap
} from "lucide-react"
import { useEffect, useState } from "react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts"
import { io, Socket } from "socket.io-client"

// Types
interface PerformanceIssue {
  location: string
  device: string
  deviceId: string
  efficiency: number
  status: "critical" | "warning"
  rootCauses: string[]
  impact: {
    energyWaste: number
    costPerMonth: number
    carbonExtra: number
  }
  recommendations: Array<{
    action: string
    priority: "high" | "medium"
    estimatedSaving: number
    timeline: string
  }>
}

interface AnalyticsData {
  performanceIssues: PerformanceIssue[]
  performanceIssuesPagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  trendAnalysis: any
  buildingComparison: any[]
  costOptimization: any
  carbonFootprint: any
  forecast: any
  metadata: {
    timeRange: string
    factoryId: string
    generatedAt: string
  }
  hierarchyMetrics?: {
    totalDevices: number
    avgEfficiency: number
    totalEnergy: number
  }
}

// Hierarchy types
interface HierarchyLevel {
  type: 'all' | 'factory' | 'building' | 'floor' | 'line' | 'device'
  id: string
  name: string
}

interface HierarchyItem {
  id: string
  name: string
  type: 'factory' | 'building' | 'floor' | 'line' | 'device'
  totalDevices?: number
  avgEfficiency?: number
  totalEnergy?: number
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("1h")
  const [selectedFactory, setSelectedFactory] = useState("all")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("performance")
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(["performance"]))
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  
  // Hierarchy navigation state
  const [hierarchyPath, setHierarchyPath] = useState<HierarchyLevel[]>([
    { type: 'all', id: 'all', name: 'All Factories' }
  ])
  const [hierarchyItems, setHierarchyItems] = useState<HierarchyItem[]>([])
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false)

  // Power trend dialog state
  const [isPowerTrendDialogOpen, setIsPowerTrendDialogOpen] = useState(false)
  const [selectedDeviceForTrend, setSelectedDeviceForTrend] = useState<PerformanceIssue | null>(null)
  const [powerTrendData, setPowerTrendData] = useState<any[]>([])
  const [isLoadingPowerTrend, setIsLoadingPowerTrend] = useState(false)
  const [powerTrendTimeRange, setPowerTrendTimeRange] = useState("1d")

  const { t } = useTranslation()


  // Hierarchy navigation functions
  const fetchHierarchyData = async (currentLevel: HierarchyLevel) => {
    setIsLoadingHierarchy(true)
    try {
      let items: HierarchyItem[] = []
      
      switch (currentLevel.type) {
        case 'all':
          // Fetch all factories
          const factories = await FactoryApiService.getFactories()
          items = factories.map((f: any) => ({
            id: f.id,
            name: f.name,
            type: 'factory' as const,
            totalDevices: 0, // Will be calculated
            avgEfficiency: 0,
            totalEnergy: 0
          }))
          break
          
        case 'factory':
          // Fetch buildings for this factory
          const buildings = await BuildingApiService.getBuildingsByFactory(currentLevel.id)
          items = buildings.map((b: any) => ({
            id: b.id,
            name: b.name,
            type: 'building' as const,
            totalDevices: 0,
            avgEfficiency: 0,
            totalEnergy: 0
          }))
          break
          
        case 'building':
          // Fetch floors for this building
          const floors = await FloorApiService.getFloorsByBuilding(currentLevel.id)
          items = floors.map((f: any) => ({
            id: f.id,
            name: f.name,
            type: 'floor' as const,
            totalDevices: 0,
            avgEfficiency: 0,
            totalEnergy: 0
          }))
          break
          
        case 'floor':
          // Fetch lines for this floor
          const lines = await LineApiService.getLinesByFloor(currentLevel.id)
          items = lines.map((l: any) => ({
            id: l.id,
            name: l.name,
            type: 'line' as const,
            totalDevices: 0,
            avgEfficiency: 0,
            totalEnergy: 0
          }))
          break
          
        case 'line':
          // Fetch devices for this line
          const devices = await DeviceApiService.getDevicesByLine(currentLevel.id)
          items = devices.map((d: any) => ({
            id: d.id,
            name: d.name,
            type: 'device' as const,
            totalDevices: 1,
            avgEfficiency: 0,
            totalEnergy: 0
          }))
          break
      }
      
      // Fetch metrics for each item in parallel
      if (items.length > 0 && currentLevel.type !== 'line') {
        const metricsPromises = items.map(async (item) => {
          try {
            const response = await AnalyticApiService.getHierarchy(timeRange, item.type, item.id)
            return {
              ...item,
              ...response
            }
          } catch (error) {
            console.error(`Error fetching metrics for ${item.type} ${item.id}:`, error)
            return item
          }
        })
        
        items = await Promise.all(metricsPromises)
      }
      console.log(items)
      setHierarchyItems(items)
    } catch (error) {
      console.error('Error fetching hierarchy data:', error)
      setHierarchyItems([])
    } finally {
      setIsLoadingHierarchy(false)
    }
  }

  const navigateToLevel = (item: HierarchyItem) => {
    const newLevel: HierarchyLevel = {
      type: item.type,
      id: item.id,
      name: item.name
    }
    
    setHierarchyPath(prev => [...prev, newLevel])
  }

  const navigateBack = (index: number) => {
    setHierarchyPath(prev => prev.slice(0, index + 1))
  }

  // Fetch hierarchy data when path changes
  useEffect(() => {
    const currentLevel = hierarchyPath[hierarchyPath.length - 1]
    if (currentLevel.type !== 'line') {
      fetchHierarchyData(currentLevel)
    }
  }, [hierarchyPath])

  // Fetch power trend data for a device
  const fetchPowerTrendData = async (deviceId: string, timeRange: string) => {
    setIsLoadingPowerTrend(true)
    try {
      const response = await AnalyticApiService.getPowerTrendDevice(deviceId, timeRange)
      
      setPowerTrendData(response)
    } catch (error) {
      console.error('Error fetching power trend data:', error)
      setPowerTrendData([])
    } finally {
      setIsLoadingPowerTrend(false)
    }
  }

  // Handle opening power trend dialog
  const handleViewPowerTrend = (issue: PerformanceIssue) => {
    setSelectedDeviceForTrend(issue)
    setIsPowerTrendDialogOpen(true)
    fetchPowerTrendData(issue.deviceId, powerTrendTimeRange)
  }

  // Handle time range change in power trend dialog
  const handlePowerTrendTimeRangeChange = (newTimeRange: string) => {
    setPowerTrendTimeRange(newTimeRange)
    if (selectedDeviceForTrend) {
      fetchPowerTrendData(selectedDeviceForTrend.deviceId, newTimeRange)
    }
  }

  // Handle setting device to maintenance mode
  const handleSetMaintenance = async (issue: PerformanceIssue) => {
    if (!confirm(`Set device "${issue.device}" to Maintenance mode?\n\nThis will prevent the device from generating alerts while it's being serviced.`)) {
      return
    }
    
    try {
      await DeviceApiService.updateDeviceStatus(issue.deviceId, 'Maintenance')
      alert(`Device "${issue.device}" has been set to Maintenance mode.`)
      // Optionally refresh the data
      // You might want to remove this device from the performance issues list
      // or update its status in the UI
    } catch (error) {
      console.error('Error setting device to maintenance:', error)
      alert('Failed to set device to maintenance mode. Please try again.')
    }
  }

  // Map tab names to backend sections
  const tabToSection: Record<string, string> = {
    performance: "performance",
    trends: "trends",
    comparison: "comparison",
    cost: "cost",
    carbon: "carbon",
    forecast: "forecast",
  }

  // Initialize WebSocket connection
  useEffect(() => {
    const apiUrl = BASE_API_URL
    console.log("🔌 Connecting to WebSocket at:", apiUrl)
    
    const socketInstance = io(apiUrl, {
      transports: ["websocket"],
    })

    socketInstance.on("connect", () => {
      console.log("✅ Connected to WebSocket, socket ID:", socketInstance.id)
      
      // Subscribe to initial tab (performance)
      console.log("📤 Subscribing to initial section:", { section: "hierarchy", filters: { timeRange, factoryId: selectedFactory, page, limit } })
      socketInstance.emit("subscribe-analytics-section", {
        section: "hierarchy",
        filters: {
          timeRange,
          factoryId: selectedFactory,
          page,
          limit
        }
      })
    })

    socketInstance.on("analytics-data", (data) => {
      console.log("📊 Received analytics data:", data)
      setAnalyticsData(prev => {
        if (!prev) return data.data
        
        // If it's a pagination update for performance issues, append the data
        if (data.filters?.page > 1 && data.data.performanceIssues) {
           return {
             ...prev,
             ...data.data,
             performanceIssues: [...prev.performanceIssues, ...data.data.performanceIssues],
             metadata: data.data.metadata
           }
        }
        
        return {
          ...prev,
          ...data.data,
          metadata: data.data.metadata
        }
      })
      setIsLoading(false)
    })

    socketInstance.on("analytics-error", (error) => {
      console.error("❌ Analytics error:", error)
      setIsLoading(false)
    })

    socketInstance.on("performance-issue", (data) => {
      console.log("⚠️ New performance issue:", data)
      // Handle real-time performance issue alerts
    })

    socketInstance.on("disconnect", () => {
      console.log("🔌 Disconnected from WebSocket")
    })
    
    socketInstance.on("connect_error", (error) => {
      console.error("❌ Connection error:", error)
      setIsLoading(false)
    })

    setSocket(socketInstance)

    return () => {
      console.log("🔌 Cleaning up WebSocket connection")
      socketInstance.emit("unsubscribe-analytics")
      socketInstance.disconnect()
    }
  }, [])

  // Handle tab change and lazy loading
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const section = tabToSection[value]
    
    if (section && !loadedTabs.has(value) && socket?.connected) {
      console.log(`🔄 Lazy loading section: ${section}`)
      socket.emit("subscribe-analytics-section", {
        section,
        filters: {
          timeRange,
          factoryId: selectedFactory,
        }
      })
      setLoadedTabs(prev => new Set(prev).add(value))
    }
  }

  // Handle load more
  const handleLoadMore = () => {
    if (socket && socket.connected) {
      const nextPage = page + 1
      setPage(nextPage)
      console.log(`🔄 Loading more performance issues (page ${nextPage})`)
      socket.emit("subscribe-analytics-section", {
        section: "performance",
        filters: {
          timeRange,
          factoryId: selectedFactory,
          page: nextPage,
          limit
        }
      })
    }
  }

  // Update filters
  useEffect(() => {
    if (socket && socket.connected) {
      // Reset loaded tabs when filters change, but keep active tab
      setLoadedTabs(new Set([activeTab]))
      console.log("loadedTab", Array.from(loadedTabs))
      setPage(1) // Reset page
      
      socket.emit("update-analytics-filters", {
        timeRange,
        factoryId: selectedFactory,
        page: 1,
        limit
      })
      setIsLoading(true)
    }
  }, [timeRange, selectedFactory, socket])

  // Fetch performance issues when navigating to line level
  useEffect(() => {
    const currentLevel = hierarchyPath[hierarchyPath.length - 1]
    
    if (currentLevel.type === 'line' && socket && socket.connected) {
      console.log(`🔍 Fetching performance issues for line: ${currentLevel.id}`)
      
      // Subscribe to performance issues for this line
      socket.emit("update-analytics-filters", {
          timeRange,
          lineId: currentLevel.id,
          page: 1,
          limit
      })
      
      setIsLoading(true)
    }
  }, [hierarchyPath, socket, timeRange, limit])

  // Subscribe to hierarchy metrics when path changes
  useEffect(() => {
    const currentLevel = hierarchyPath[hierarchyPath.length - 1]
    
    if (socket && socket.connected && currentLevel.type !== 'all' && currentLevel.type !== 'line') {
      console.log(`🔍 Subscribing to hierarchy metrics for: ${currentLevel.type} ${currentLevel.id}`)
      
      socket.emit("subscribe-analytics-section", {
          section: "hierarchy",
          filters: {
              timeRange,
              hierarchyType: currentLevel.type,
              hierarchyId: currentLevel.id
          }
      })
    }
  }, [hierarchyPath, socket, timeRange])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading analytics data...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Enhanced Header với thời gian cập nhật và controls */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Energy Analytics Dashboard</h1>
                  <p className="text-sm text-slate-600">Real-time energy monitoring and optimization insights</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start justify-between sm:items-center">
                {/* Last Updated Time với status indicator */}
                <div className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${socket?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-slate-600">
                    Last updated: {analyticsData?.metadata?.generatedAt ? 
                      new Date(analyticsData.metadata.generatedAt).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 
                      'Never'
                    }
                  </span>
                  {socket?.connected && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Live
                    </Badge>
                  )}
                </div>
                
                {/* Controls */}
                <div className="flex gap-3">
                  {/* <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Factory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Factories</SelectItem>
                      <SelectItem value="F001">Factory 1</SelectItem>
                      <SelectItem value="F002">Factory 2</SelectItem>
                      <SelectItem value="F003">Factory 3</SelectItem>
                    </SelectContent>
                  </Select> */}
                  
                  {/* <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button> */}
                </div>
              </div>
            </div>
          </div>

          {/* KPI Dashboard - Nổi bật ở đầu trang */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Efficiency KPI */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Efficiency Score</p>
                    <p className="text-3xl font-bold text-green-800 mt-1">
                      {analyticsData?.kpiData?.efficiency?.score! || 0}%
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      {analyticsData?.kpiData?.efficiency?.rating || 'N/A'}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-green-700 mb-1">
                    <span>Uptime</span>
                    <span>{(analyticsData?.kpiData?.efficiency?.uptimeScore!) || 0}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${analyticsData?.kpiData?.efficiency?.uptimeScore! || 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Power Factor KPI */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">{t('analytics.kpi.powerFactor')}</p>
                    <p className="text-3xl font-bold text-blue-800 mt-1">
                      {analyticsData?.kpiData?.powerFactor?.overallAveragePF!.toFixed(2) || 0.85}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      {t('analytics.kpi.target')}: ≥0.85
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-blue-700 mb-1">
                    <span>{t('analytics.kpi.lowPFReadings')}</span>
                    <span>{analyticsData?.kpiData?.powerFactor?.lowPFPercentage!.toFixed(1) || 0}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${analyticsData?.kpiData?.powerFactor?.lowPFPercentage! || 0}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overload KPI */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-700">{t('analytics.kpi.overloadRisk')}</p>
                    <p className="text-3xl font-bold text-amber-800 mt-1">
                      {analyticsData?.kpiData?.overload?.downtimePercentage!.toFixed(1) || 0}%
                    </p>
                    <p className="text-xs text-amber-600 mt-2">
                      {t('analytics.kpi.downtimeHours')}: {analyticsData?.kpiData?.overload?.totalDowntimeHours!.toFixed(1) || 0}h
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-amber-700 mb-1">
                    <span>{t('analytics.kpi.criticalAlerts')}</span>
                    <span>{analyticsData?.kpiData?.overload?.criticalAlertsCount || 0}</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${Math.min((analyticsData?.kpiData?.overload?.criticalAlertsCount || 0) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Energy Summary */}
            <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{t('analytics.kpi.energyConsumption')}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {analyticsData?.kpiData?.energyConsumption?.totalEnergyConsumption?.toFixed(2) || 0}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                      {t('analytics.kpi.kwhThisPeriod')}
                    </p>
                  </div>
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <Leaf className="h-8 w-8 text-slate-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-700 mb-1">
                    <span>{t('analytics.kpi.cost')}</span>
                    <span>{( analyticsData?.kpiData?.energyConsumption?.totalCost > 1000000 ? `${(analyticsData?.kpiData?.energyConsumption?.totalCost / 1000000).toFixed(1)}M` : `${(analyticsData?.kpiData?.energyConsumption?.totalCost || 0).toFixed(1)}K`)} VND</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-slate-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="performance" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="bg-white border-0 shadow-sm">
              <TabsTrigger value="performance">{t('analytics.tabs.performance')}</TabsTrigger>
              {/* <TabsTrigger value="recommendations">{t('analytics.tabs.recommendations')}</TabsTrigger> */}
              <TabsTrigger value="trends">{t('analytics.tabs.trends')}</TabsTrigger>
              <TabsTrigger value="comparison">{t('analytics.tabs.comparison')}</TabsTrigger>
              <TabsTrigger value="cost">{t('analytics.tabs.cost')}</TabsTrigger>
              {/* <TabsTrigger value="carbon">{t('analytics.tabs.carbon')}</TabsTrigger>
              <TabsTrigger value="forecast">Forecasting</TabsTrigger> */}
            </TabsList>

            {/* Performance Issues Tab */}
            <TabsContent value="performance" className="space-y-6 mt-6">
              {/* Critical Alerts Summary */}
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-900">Critical Issues</p>
                        <p className="text-2xl font-bold text-red-700">
                          {analyticsData.performanceIssues.filter((i) => i.status === "critical").length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-900">Warning Issues</p>
                        <p className="text-2xl font-bold text-amber-700">
                          {analyticsData.performanceIssues.filter((i) => i.status === "warning").length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-900">Healthy Devices</p>
                        <p className="text-2xl font-bold text-green-700">
                          {analyticsData?.summary?.devices - (analyticsData?.alerts?.totalAlerts || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div> */}

              {/* Hierarchical View */}
              {/* <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Hierarchical Performance Overview
                  </CardTitle>
                  <CardDescription>Factory → Building → Floor → Line performance breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsData?.hierarchy ? (
                    <div className="space-y-6">
                      {analyticsData.hierarchy.byFactory && analyticsData.hierarchy.byFactory.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                            Factory Level
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {analyticsData.hierarchy.byFactory.map((factory, idx) => (
                              <div key={idx} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-blue-900">Factory {factory.id}</span>
                                  <Badge className="bg-blue-100 text-blue-700">
                                    {factory.deviceCount} devices
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">Energy:</span>
                                    <span className="font-medium">{factory.energy} kWh</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-blue-700">Cost:</span>
                                    <span className="font-medium">{(factory.cost / 1000).toFixed(0)}K VND</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analyticsData.hierarchy.byBuilding && analyticsData.hierarchy.byBuilding.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            Building Level
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {analyticsData.hierarchy.byBuilding.slice(0, 8).map((building, idx) => (
                              <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-green-900 text-sm">Building {building.id}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {building.deviceCount} dev
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-green-700">Energy:</span>
                                    <span className="font-medium">{building.energy} kWh</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-600 text-center py-8">Loading hierarchy data...</p>
                  )}
                </CardContent>
              </Card> */}

              {/* Breadcrumb Navigation */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  {hierarchyPath.map((level, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        onClick={() => navigateBack(index)}
                        className={`px-3 py-1.5 rounded-md transition-colors ${
                          index === hierarchyPath.length - 1
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {level.type === 'all' && <Home className="h-4 w-4 inline mr-1" />}
                        {level.type === 'factory' && <Factory className="h-4 w-4 inline mr-1" />}
                        {level.type === 'building' && <Building2 className="h-4 w-4 inline mr-1" />}
                        {level.type === 'floor' && <Layers className="h-4 w-4 inline mr-1" />}
                        {level.type === 'line' && <Zap className="h-4 w-4 inline mr-1" />}
                        {level.name}
                      </button>
                      {index < hierarchyPath.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hierarchy Items Grid or Performance Issues */}
              {hierarchyPath[hierarchyPath.length - 1].type === 'line' ? (
                // Show performance issues when at device level
                analyticsData?.performanceIssues && analyticsData.performanceIssues.length > 0 ? (
                <>
                  {/* <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-red-900">
                          {analyticsData.performanceIssues.filter((i) => i.status === "critical").length} Critical Issues Require Immediate Attention
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          Potential monthly savings: {(
                            analyticsData.recommendations?.reduce((sum, r) => sum + r.estimatedSavings, 0) / 1000 || 0
                          ).toFixed(0)}K VND
                        </p>
                      </div>
                      <Button className="bg-red-600 hover:bg-red-700 text-white">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        View All Critical
                      </Button>
                    </div>
                  </div> */}

                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    {analyticsData.performanceIssues.map((issue, index) => (
                      <Card
                        key={index}
                        className={`border-2 ${
                          issue.status === "critical"
                            ? "border-red-300 bg-red-50/50 shadow-red-100 shadow-lg"
                            : "border-amber-300 bg-amber-50/50 shadow-amber-100 shadow-lg"
                        }`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge
                                  className={
                                    issue.status === "critical" 
                                      ? "bg-red-600 text-white animate-pulse" 
                                      : "bg-amber-600 text-white"
                                  }
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {issue.status === "critical" ? "CRITICAL" : "WARNING"}
                                </Badge>
                                <span className="text-sm text-slate-600">{issue.location}</span>
                                <span className="text-xs text-slate-500">
                                  Last updated: {new Date().toLocaleTimeString()}
                                </span>
                              </div>
                              <CardTitle className="text-xl">{issue.device}</CardTitle>
                              <CardDescription className="mt-1">
                                Current Efficiency: 
                                <span className={`font-bold ${
                                  issue.efficiency < 70 ? 'text-red-600' : 
                                  issue.efficiency < 85 ? 'text-amber-600' : 'text-green-600'
                                }`}>
                                  {issue.efficiency}%
                                </span> 
                                ({t('analytics.performance.target')}: ≥85%)
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="text-right">
                                <div className={`text-3xl font-bold ${
                                  issue.efficiency < 70 ? 'text-red-600' : 
                                  issue.efficiency < 85 ? 'text-amber-600' : 'text-green-600'
                                }`}>
                                  {issue.efficiency}%
                                </div>
                                <div className="text-xs text-slate-600 mt-1">{t('analytics.performance.efficiencyScore')}</div>
                              </div>
                              {/* <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-xs">
                                  View Details
                                </Button>
                                <Button size="sm" className={`text-xs ${
                                  issue.status === "critical" 
                                    ? "bg-red-600 hover:bg-red-700" 
                                    : "bg-amber-600 hover:bg-amber-700"
                                }`}>
                                  Schedule Maintenance
                                </Button>
                              </div> */}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Root Causes */}
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              {t('analytics.performance.rootCausesIdentified')}
                            </h4>
                            <div className="space-y-2">
                              {issue.rootCauses.map((cause, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm">
                                  <div className="h-1.5 w-1.5 rounded-full bg-red-600 mt-1.5" />
                                  <span className="text-slate-700">{cause}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-3 pt-4 border-t border-slate-200">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleViewPowerTrend(issue)}
                            >
                              <Search className="h-4 w-4 mr-2" />
                              {t('analytics.performance.viewDetails')}
                            </Button>
                            {/* <Button variant="outline" size="sm" className="flex-1">
                              <Download className="h-4 w-4 mr-2" />
                              Export Data
                            </Button> */}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleSetMaintenance(issue)}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              {t('analytics.performance.maintenance')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {analyticsData.performanceIssuesPagination && 
                   analyticsData.performanceIssuesPagination.page < analyticsData.performanceIssuesPagination.totalPages && (
                    <div className="flex justify-center mt-6">
                      <Button 
                        variant="outline" 
                        onClick={handleLoadMore}
                        className="min-w-[200px]"
                      >
                        Load More Issues ({analyticsData.performanceIssuesPagination.total - analyticsData.performanceIssues.length} remaining)
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <Leaf className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">{t('analytics.performance.allSystemsNormal')}</h3>
                        <p className="text-slate-600">{t('analytics.performance.noIssues')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              // Show hierarchy items grid when not at device level
              <div>
                {isLoadingHierarchy ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600 mt-4">{t('analytics.performance.loadingHierarchy')}</p>
                  </div>
                ) : hierarchyItems.length > 0 ? (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {hierarchyItems.map((item) => (
                      <Card
                        key={item.id}
                        className={`cursor-pointer hover:shadow-lg transition-all border-2 ${!item.avgEfficiency ? 'bg-red-50 border-red-300 text-red-600' : item.avgEfficiency >= 85 ? 'border-green-300 bg-green-50 text-green-600' : item.avgEfficiency >= 65 ? 'border-amber-300 bg-amber-50 text-amber-600' : 'border-red-300 bg-red-50 text-red-600'} hover:scale-[1.02] ${item.type === 'device' ? 'hover:border-red-300' : ''}`}
                        onClick={() => navigateToLevel(item)}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg flex items-center justify-center">
                              {item.type === 'factory' && <Factory className="h-6 w-6" />}
                              {item.type === 'building' && <Building2 className="h-6 w-6" />}
                              {item.type === 'floor' && <Layers className="h-6 w-6" />}
                              {item.type === 'line' && <Zap className="h-6 w-6" />}
                              {/* {item.type === 'device' && <BarChart3 className="h-6 w-6 text-blue-600" />} */}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <CardDescription className="capitalize">{item.type}</CardDescription>
                            </div>
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className={`grid grid-cols-3 gap-2 text-center`}>
                            <div className={`rounded p-2 ${!item.avgEfficiency ? 'bg-red-100 border-red-300' : item.avgEfficiency >= 85 ? 'bg-green-100 text-green-600' : item.avgEfficiency >= 65 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                              <div className="text-xs">{t('analytics.performance.devices')}</div>
                              <div className="text-lg font-bold">{item.totalDevices || 0}</div>
                            </div>
                            <div className={`rounded p-2 ${!item.avgEfficiency ? 'bg-red-100 border-red-300' : item.avgEfficiency >= 85 ? 'bg-green-100 text-green-600' : item.avgEfficiency >= 65 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                              <div className="text-xs">{t('analytics.performance.efficiency')}</div>
                              <div className="text-lg font-bold">{item.avgEfficiency || 0}%</div>
                            </div>
                            <div className={`rounded p-2 ${!item.avgEfficiency ? 'bg-red-100 border-red-300' : item.avgEfficiency >= 85 ? 'bg-green-100 text-green-600' : item.avgEfficiency >= 65 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                              <div className="text-xs">{t('analytics.performance.energy')}</div>
                              <div className="text-lg font-bold">{item.totalEnergy || 0}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{t('analytics.performance.noItems')}</h3>
                    <p className="text-slate-600">No {hierarchyPath[hierarchyPath.length - 1].type}s {t('analytics.performance.noItemsAtLevel')}</p>
                  </div>
                )}
              </div>
            )}
            </TabsContent>

            {/* Action Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6 mt-6">
              {analyticsData?.recommendations && analyticsData.recommendations.length > 0 ? (
                <>
                  {/* Recommendations Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-red-900">Critical Actions</p>
                            <p className="text-2xl font-bold text-red-700">
                              {analyticsData.recommendations.filter(r => r.priority === 'critical').length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-900">High Priority</p>
                            <p className="text-2xl font-bold text-amber-700">
                              {analyticsData.recommendations.filter(r => r.priority === 'high').length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">Medium Priority</p>
                            <p className="text-2xl font-bold text-blue-700">
                              {analyticsData.recommendations.filter(r => r.priority === 'medium').length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Leaf className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-green-900">Total Savings</p>
                            <p className="text-2xl font-bold text-green-700">
                              {(analyticsData.recommendations.reduce((sum, r) => sum + r.estimatedSavings, 0) / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-xs text-green-600">VND/month</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recommendations List */}
                  <div className="space-y-4">
                    {analyticsData.recommendations.map((rec, index) => (
                      <Card
                        key={index}
                        className={`border-l-4 ${
                          rec.priority === 'critical' ? 'border-l-red-500 bg-red-50/50' :
                          rec.priority === 'high' ? 'border-l-amber-500 bg-amber-50/50' :
                          rec.priority === 'medium' ? 'border-l-blue-500 bg-blue-50/50' :
                          'border-l-green-500 bg-green-50/50'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge
                                  className={`${
                                    rec.priority === 'critical' ? 'bg-red-600 text-white' :
                                    rec.priority === 'high' ? 'bg-amber-600 text-white' :
                                    rec.priority === 'medium' ? 'bg-blue-600 text-white' :
                                    'bg-green-600 text-white'
                                  }`}
                                >
                                  {rec.priority.toUpperCase()} PRIORITY
                                </Badge>
                                <Badge variant="outline" className="text-slate-600">
                                  {rec.category.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>

                              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                {t(rec.title) !== rec.title ? t(rec.title) : rec.title}
                              </h3>

                              <p className="text-slate-700 mb-4">
                                {t(rec.description) !== rec.description ? t(rec.description) : rec.description}
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-blue-600" />
                                  <span className="text-slate-600">Impact:</span>
                                  <span className="font-medium text-slate-900">{rec.impact}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-green-600" />
                                  <span className="text-slate-600">Action:</span>
                                  <span className="font-medium text-slate-900">{t(rec.action)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Leaf className="h-4 w-4 text-green-600" />
                                  <span className="text-slate-600">Savings:</span>
                                  <span className="font-bold text-green-700">
                                    {(rec.estimatedSavings / 1000).toFixed(0)}K VND/month
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[140px]">
                              <Button
                                className={`w-full ${
                                  rec.priority === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                                  rec.priority === 'high' ? 'bg-amber-600 hover:bg-amber-700' :
                                  rec.priority === 'medium' ? 'bg-blue-600 hover:bg-blue-700' :
                                  'bg-green-600 hover:bg-green-700'
                                }`}
                              >
                                <Zap className="h-4 w-4 mr-2" />
                                Implement
                              </Button>

                              <Button variant="outline" className="w-full">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Details
                              </Button>

                              <Button variant="outline" className="w-full">
                                <Download className="h-4 w-4 mr-2" />
                                Export Plan
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Implementation Timeline */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Implementation Roadmap
                      </CardTitle>
                      <CardDescription>
                        Suggested timeline for implementing recommendations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-red-700 font-bold">1</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-900">Week 1: Critical Issues</h4>
                            <p className="text-sm text-red-700">
                              Address {analyticsData.recommendations.filter(r => r.priority === 'critical').length} critical recommendations
                            </p>
                          </div>
                          <Badge className="bg-red-100 text-red-700">Immediate</Badge>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-amber-700 font-bold">2</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-amber-900">Week 2-4: High Priority</h4>
                            <p className="text-sm text-amber-700">
                              Implement {analyticsData.recommendations.filter(r => r.priority === 'high').length} high-priority actions
                            </p>
                          </div>
                          <Badge className="bg-amber-100 text-amber-700">1-4 Weeks</Badge>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-bold">3</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-blue-900">Month 2-3: Medium Priority</h4>
                            <p className="text-sm text-blue-700">
                              Complete {analyticsData.recommendations.filter(r => r.priority === 'medium').length} medium-priority improvements
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">2-3 Months</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                        <Leaf className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-900">Excellent Performance!</h3>
                        <p className="text-slate-600">No action recommendations needed at this time.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Trend Analysis Tab */}
            <TabsContent value="trends" className="space-y-6 mt-6">
              {analyticsData?.trendAnalysis ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-600">Average Consumption</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {analyticsData.trendAnalysis.summary.averageConsumption.toFixed(0)} kWh
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Daily average</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-600">Peak Consumption</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {analyticsData.trendAnalysis.summary.peakConsumption.toFixed(0)} kWh
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Highest recorded</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-sm font-medium text-slate-600">Lowest Consumption</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {analyticsData.trendAnalysis.summary.lowestConsumption.toFixed(0)} kWh
                        </p>
                        <p className="text-xs text-slate-500 mt-2">Lowest recorded</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Energy Consumption Trend</CardTitle>
                        <CardDescription>Daily energy usage over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analyticsData.trendAnalysis.monthlyTrend}>
                              <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 12 }} 
                                tickLine={false} 
                                axisLine={false}
                              />
                              <YAxis 
                                tick={{ fontSize: 12 }} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(value) => `${value} kWh`}
                              />
                              <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`${value.toFixed(1)} kWh`, 'Consumption']}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorValue)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Peak Hours Analysis</CardTitle>
                        <CardDescription>Consumption by time of day</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analyticsData.trendAnalysis.peakHours} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                              <XAxis type="number" hide />
                              <YAxis 
                                dataKey="time" 
                                type="category" 
                                width={80} 
                                tick={{ fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px' }}
                              />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {analyticsData.trendAnalysis.peakHours.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.isPeak ? '#ef4444' : '#22c55e'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-600">Loading trend data...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Comparison Tab */}
            <TabsContent value="comparison" className="space-y-6 mt-6">
              {analyticsData?.buildingComparison && analyticsData.buildingComparison.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Building Performance Comparison</CardTitle>
                    <CardDescription>Efficiency and consumption metrics (Average: {(analyticsData.buildingComparison.reduce((total, building) => total + building.consumption, 0) / analyticsData.buildingComparison.length).toFixed(2)} kWh)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.buildingComparison.map((building, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-slate-900">{building.name}</span>
                            <Badge
                              className={
                                building.efficiency >= 90 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                              }
                            >
                              {building.efficiency}% Efficiency
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600">Consumption</p>
                              <p className="font-bold text-slate-900">{building.consumption} kWh</p>
                            </div>
                            <div>
                              <p className="text-slate-600">Cost</p>
                              <p className="font-bold text-slate-900">{(building.cost / 1000000).toFixed(2)}M VND</p>
                            </div>
                            <div>
                              <p className="text-slate-600">vs Average</p>
                              <p
                                className={`font-bold ${building.vsAverage > 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {building.vsAverage > 0 ? "+" : ""}
                                {building.vsAverage}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-600">No comparison data available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Cost Optimization Tab */}
            <TabsContent value="cost" className="space-y-6 mt-6">
              {analyticsData?.costOptimization ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle>{t('analytics.cost.costBreakdown')}</CardTitle>
                      <CardDescription>{t('analytics.cost.energyCostDistribution')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analyticsData.costOptimization.costBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {analyticsData.costOptimization.costBreakdown.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={['#3b82f6', '#22c55e', '#f59e0b'][index % 3]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`${value}%`, 'Share']}
                              contentStyle={{ borderRadius: '8px' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <p className="text-sm text-slate-500">{t('analytics.cost.total')}</p>
                            <p className="text-xl font-bold text-slate-900">100%</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {analyticsData.costOptimization.costBreakdown.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600">{item.category}</span>
                            <span className="font-medium">{(item.amount >= 100000 ? `${(item.amount / 1000000).toFixed(2)}M` : `${(item.amount).toFixed(2)}`)} VND</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>{t('analytics.cost.optimizationOpportunities')}</CardTitle>
                      <CardDescription>{t('analytics.cost.actionableInsights')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyticsData.costOptimization.optimizations.map((opt: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-slate-900">{opt.title}</h4>
                                <p className="text-sm text-slate-600 mt-1">{opt.description}</p>
                              </div>
                              <Badge className={opt.priority === 'high' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}>
                                {opt.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Zap className="h-4 w-4 text-amber-500" />
                                <span>{opt.implementation}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-green-600">
                                  {t('analytics.cost.potentialSavings')}
                                </p>
                                <p className="text-lg font-bold text-green-700">
                                  {opt.savings.toLocaleString()} k VND
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-600">{t('analytics.cost.loadingCostData')}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Carbon & Sustainability Tab */}
            <TabsContent value="carbon" className="space-y-6 mt-6">
              {analyticsData?.carbonFootprint && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Total Emissions</p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {analyticsData.carbonFootprint.totalEmissions} kg CO₂
                          </p>
                          <p className="text-xs text-slate-500 mt-2">This month</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Leaf className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Carbon Intensity</p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {analyticsData.carbonFootprint.carbonIntensity} g/kWh
                          </p>
                          <p className="text-xs text-slate-500 mt-2">Vietnam grid average</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Trees Needed</p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            {analyticsData.carbonFootprint.treesNeeded} trees
                          </p>
                          <p className="text-xs text-slate-500 mt-2">For 1 year offset</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Leaf className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Forecasting Tab */}
            <TabsContent value="forecast" className="space-y-6 mt-6">
              {analyticsData?.forecast ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Energy Consumption Forecast</CardTitle>
                      <CardDescription>Predictive analytics for the next 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              allowDuplicatedCategory={false}
                              tick={{ fontSize: 12 }} 
                              tickLine={false} 
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }} 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(value) => `${value} kWh`}
                            />
                            <Tooltip 
                              contentStyle={{ borderRadius: '8px' }}
                              formatter={(value: number) => [`${value.toFixed(1)} kWh`, 'Consumption']}
                            />
                            <Legend />
                            <Line 
                              data={analyticsData.forecast.historical} 
                              type="monotone" 
                              dataKey="value" 
                              name="Historical" 
                              stroke="#3b82f6" 
                              strokeWidth={2} 
                              dot={false}
                            />
                            <Line 
                              data={analyticsData.forecast.forecast} 
                              type="monotone" 
                              dataKey="value" 
                              name="Forecast" 
                              stroke="#8b5cf6" 
                              strokeWidth={2} 
                              strokeDasharray="5 5" 
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Forecast Summary</CardTitle>
                      <CardDescription>AI-driven predictions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Predicted Trend</p>
                        <div className="flex items-center gap-2 mt-2">
                          {analyticsData.forecast.trend > 0 ? (
                            <div className="flex items-center text-red-600">
                              <span className="text-2xl font-bold">Increasing</span>
                              <AlertTriangle className="h-5 w-5 ml-2" />
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <span className="text-2xl font-bold">Decreasing</span>
                              <Leaf className="h-5 w-5 ml-2" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          Consumption is expected to {analyticsData.forecast.trend > 0 ? 'increase' : 'decrease'} by {Math.abs(analyticsData.forecast.trend).toFixed(1)} kWh/day
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700">Confidence Score</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">High</Badge>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Based on historical data patterns and seasonality analysis.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-600">Loading forecast data...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Power Trend Dialog */}
          <Dialog open={isPowerTrendDialogOpen} onOpenChange={setIsPowerTrendDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {selectedDeviceForTrend?.device || 'Device'} - Power Trend
                </DialogTitle>
                <DialogDescription>
                  {selectedDeviceForTrend?.location && (
                    <span className="text-sm text-slate-600">
                      Location: {selectedDeviceForTrend.location}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Time Range Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-700">Time Range:</span>
                  <div className="flex gap-2">
                    {['1d', '7d', '30d'].map((range) => (
                      <Button
                        key={range}
                        variant={powerTrendTimeRange === range ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePowerTrendTimeRangeChange(range)}
                        disabled={isLoadingPowerTrend}
                      >
                        {range === '1d' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Device Info Cards */}
                {selectedDeviceForTrend && (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className={`${
                      selectedDeviceForTrend.efficiency < 70 ? 'bg-red-50 border-red-200' :
                      selectedDeviceForTrend.efficiency < 85 ? 'bg-amber-50 border-amber-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-slate-600">Current Efficiency</p>
                        <p className={`text-2xl font-bold mt-1 ${
                          selectedDeviceForTrend.efficiency < 70 ? 'text-red-600' :
                          selectedDeviceForTrend.efficiency < 85 ? 'text-amber-600' :
                          'text-green-600'
                        }`}>
                          {selectedDeviceForTrend.efficiency}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card className={`${
                      selectedDeviceForTrend.status === 'critical' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-slate-600">Status</p>
                        <Badge className={`mt-2 ${
                          selectedDeviceForTrend.status === 'critical' ? 'bg-red-600' : 'bg-amber-600'
                        }`}>
                          {selectedDeviceForTrend.status.toUpperCase()}
                        </Badge>
                      </CardContent>
                    </Card>

                    {/* <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-slate-600">Energy Impact</p>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          {selectedDeviceForTrend.impact?.energyWaste?.toFixed(2) || 'N/A'} kWh
                        </p>
                      </CardContent>
                    </Card> */}
                  </div>
                )}

                {/* Power Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      Power Consumption Trend
                    </CardTitle>
                    <CardDescription>
                      Historical power consumption over the selected time range
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPowerTrend ? (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-slate-600">Loading power trend data...</p>
                        </div>
                      </div>
                    ) : powerTrendData.length > 0 ? (
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={powerTrendData}>
                            <defs>
                              <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }} 
                              tickLine={false} 
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }} 
                              tickLine={false} 
                              axisLine={false}
                              tickFormatter={(value) => `${value} W`}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '12px'
                              }}
                              formatter={(value: any) => [`${value.toFixed(2)} W`, 'Power']}
                              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              fill="url(#colorPower)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[400px] flex items-center justify-center">
                        <div className="text-center">
                          <AlertTriangle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600 font-medium">No power trend data available</p>
                          <p className="text-sm text-slate-500 mt-2">
                            Try selecting a different time range or check back later
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Root Causes */}
                {selectedDeviceForTrend && selectedDeviceForTrend.rootCauses.length > 0 && (
                  <Card className="bg-red-50 border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-900">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Identified Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedDeviceForTrend.rootCauses.map((cause, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <div className="h-1.5 w-1.5 rounded-full bg-red-600 mt-1.5" />
                            <span className="text-red-900">{cause}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </MainLayout>
  )
}
