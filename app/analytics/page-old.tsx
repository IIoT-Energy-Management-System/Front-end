"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    AlertTriangle,
    BarChart3,
    Download,
    Leaf,
    Zap,
    TrendingUp,
    TrendingDown,
    Activity,
    Wrench,
    Eye,
    RefreshCw,
    Clock,
    Target,
    AlertCircle,
    CheckCircle,
    XCircle
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
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30d")
  const [selectedFactory, setSelectedFactory] = useState("all")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("performance")
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(["performance"]))
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    console.log("🔌 Connecting to WebSocket at:", apiUrl)
    
    const socketInstance = io(apiUrl, {
      transports: ["websocket"],
    })

    socketInstance.on("connect", () => {
      console.log("✅ Connected to WebSocket, socket ID:", socketInstance.id)
      
      // Subscribe to initial tab (performance)
      console.log("📤 Subscribing to initial section:", { section: "performance", filters: { timeRange, factoryId: selectedFactory, page, limit } })
      socketInstance.emit("subscribe-analytics-section", {
        section: "performance",
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
              <p className="text-slate-600 mt-1">
                Deep insights and performance analysis • Last updated:{" "}
                {analyticsData?.metadata?.generatedAt
                  ? new Date(analyticsData.metadata.generatedAt).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                <SelectTrigger className="w-40 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Factories</SelectItem>
                  <SelectItem value="F001">Factory A</SelectItem>
                  <SelectItem value="F002">Factory B</SelectItem>
                  <SelectItem value="F003">Factory C</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 1 Days</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          <Tabs defaultValue="performance" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="bg-white border-0 shadow-sm">
              <TabsTrigger value="performance">Performance Issues</TabsTrigger>
              <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="cost">Cost Optimization</TabsTrigger>
              {/* <TabsTrigger value="carbon">Carbon & Sustainability</TabsTrigger>
              <TabsTrigger value="forecast">Forecasting</TabsTrigger> */}
            </TabsList>

            {/* Performance Issues Tab */}
            <TabsContent value="performance" className="space-y-6 mt-6">
              {analyticsData?.performanceIssues && analyticsData.performanceIssues.length > 0 ? (
                <>
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900">
                          {analyticsData.performanceIssues.filter((i) => i.status === "critical").length} Critical
                          Issues Detected
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          Immediate action required - Potential savings:{" "}
                          {(
                            analyticsData.performanceIssues.reduce(
                              (sum, i) => sum + i.recommendations.reduce((s, r) => s + r.estimatedSaving, 0),
                              0
                            ) / 1000000
                          ).toFixed(2)}
                          M VND/month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 grid-cols-2">
                    {analyticsData.performanceIssues.map((issue, index) => (
                      <Card
                        key={index}
                        className={`border-2 ${
                          issue.status === "critical"
                            ? "border-red-300 bg-red-50/50"
                            : "border-amber-300 bg-amber-50/50"
                        }`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  className={
                                    issue.status === "critical" ? "bg-red-600 text-white" : "bg-amber-600 text-white"
                                  }
                                >
                                  {issue.status === "critical" ? "CRITICAL" : "WARNING"}
                                </Badge>
                                <span className="text-sm text-slate-600">{issue.location}</span>
                              </div>
                              <CardTitle className="text-xl">{issue.device}</CardTitle>
                              <CardDescription className="mt-1">
                                Current Efficiency: {issue.efficiency}% (Below target)
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-red-600">{issue.efficiency}%</div>
                              <div className="text-xs text-slate-600 mt-1">Efficiency Score</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Root Causes */}
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              Root Causes Identified
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

                          {/* Impact Analysis */}
                          {/* <div className="grid grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-slate-200">
                            <div>
                              <p className="text-xs text-slate-600 mb-1">Energy Waste</p>
                              <p className="text-lg font-bold text-red-600">{issue.impact.energyWaste} kWh/month</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 mb-1">Cost Impact</p>
                              <p className="text-lg font-bold text-red-600">
                                {(issue.impact.costPerMonth / 1000).toFixed(0)}K VND/month
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-600 mb-1">Extra CO₂</p>
                              <p className="text-lg font-bold text-red-600">{issue.impact.carbonExtra} kg/month</p>
                            </div>
                          </div> */}

                          {/* Recommendations */}
                          {/* <div>
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                              <Zap className="h-4 w-4 text-blue-600" />
                              Recommended Actions
                            </h4>
                            <div className="space-y-3">
                              {issue.recommendations.map((rec, idx) => (
                                <div
                                  key={idx}
                                  className={`p-4 rounded-lg border-l-4 ${
                                    rec.priority === "high" ? "bg-red-50 border-red-500" : "bg-amber-50 border-amber-500"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge
                                          variant="outline"
                                          className={
                                            rec.priority === "high"
                                              ? "border-red-500 text-red-700"
                                              : "border-amber-500 text-amber-700"
                                          }
                                        >
                                          {rec.priority === "high" ? "HIGH PRIORITY" : "MEDIUM PRIORITY"}
                                        </Badge>
                                        <span className="text-xs text-slate-600">⏱ {rec.timeline}</span>
                                      </div>
                                      <p className="font-medium text-slate-900">{rec.action}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-green-600">
                                        Save {(rec.estimatedSaving / 1000).toFixed(0)}K VND/month
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div> */}

                          {/* Total Potential Savings */}
                          {/* <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-900">Total Potential Monthly Savings</p>
                                <p className="text-xs text-green-700 mt-1">If all recommendations are implemented</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">
                                  {(issue.recommendations.reduce((sum, r) => sum + r.estimatedSaving, 0) / 1000).toFixed(
                                    0
                                  )}
                                  K VND
                                </p>
                                <p className="text-xs text-green-700">per month</p>
                              </div>
                            </div>
                          </div> */}
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
                        Load More Issues
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-slate-600">No performance issues detected</p>
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
                    <CardDescription>Efficiency and consumption metrics</CardDescription>
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
                                className={`font-bold ${building.vsAverage > 0 ? "text-red-600" : "text-green-600"}`}
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
                      <CardTitle>Cost Breakdown</CardTitle>
                      <CardDescription>Energy cost distribution</CardDescription>
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
                            <p className="text-sm text-slate-500">Total</p>
                            <p className="text-xl font-bold text-slate-900">100%</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {analyticsData.costOptimization.costBreakdown.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600">{item.category}</span>
                            <span className="font-medium">{(item.amount / 1000000).toFixed(2)}M VND</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Optimization Opportunities</CardTitle>
                      <CardDescription>Actionable insights to reduce costs</CardDescription>
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
                                  Potential Savings
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
                    <p className="text-slate-600">Loading cost data...</p>
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
        </div>
      </div>
    </MainLayout>
  )
}
