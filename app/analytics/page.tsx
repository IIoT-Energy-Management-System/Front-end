"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAnalyticApi } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import { AnalyticsData, RankingData, ReportData } from "@/lib/types"
import {
    Activity,
    AlertTriangle,
    Award,
    BarChart3,
    Clock,
    Download,
    LineChart,
    Pause,
    PieChart,
    Play,
    RotateCcw,
    TrendingDown,
    TrendingUp,
    Zap
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("24h")
  const [reportPeriod, setReportPeriod] = useState("day")
  const [selectedMetric, setSelectedMetric] = useState("power")
  const [isRealTimeActive, setIsRealTimeActive] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalEnergyConsumption: 0,
    averagePowerFactor: 0,
    peakDemand: 0,
    loadFactor: 0,
    uptimePercentage: 0,
    energyEfficiency: 0,
    currentPower: 0,
    costEstimate: 0,
    trendData: [],
    devicePerformance: [],
  })
  const [rankings, setRankings] = useState<RankingData>({
    buildings: [],
    floors: [],
    lines: [],
    devices: [],
  })
  const [reportData, setReportData] = useState<ReportData>({
    period: "day",
    powerConsumption: [],
    uptime: [],
    downtime: [],
  })

  const socketRef = useRef<Socket | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const { t } = useTranslation()
  const { getAnalytics, getRankings, getReports } = useAnalyticApi()
  const [selectedFactory, setSelectedFactory] = useState<string | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null)

  // Fetch analytics data
//   const fetchAnalytics = async () => {
//     try {
//       const data = await getAnalytics({
//         timeRange,
//         factoryId: selectedFactory ?? undefined,
//         buildingId: selectedBuilding ?? undefined,
//         floorId: selectedFloor ?? undefined,
//       })
//       setAnalytics(data)
//     } catch (error) {
//       console.error("Failed to fetch analytics:", error)
//     }
//   }

//   // Fetch rankings data
//   const fetchRankings = async () => {
//     try {
//       const data = await getRankings()
//       setRankings(data)
//     } catch (error) {
//       console.error("Failed to fetch rankings:", error)
//     }
//   }

//   // Fetch reports data
//   const fetchReports = async () => {
//     try {
//       const data = await getReports({ period: reportPeriod })
//       setReportData(data)
//     } catch (error) {
//       console.error("Failed to fetch reports:", error)
//     }
//   }

  const fetchData = async () => {
    try {
        const [analyticsData, rankingsData, reportsData] = await Promise.all([
            getAnalytics({
                timeRange,
                factoryId: selectedFactory ?? undefined,
                buildingId: selectedBuilding ?? undefined,
                floorId: selectedFloor ?? undefined,
            }),
            getRankings(),
            getReports({ period: reportPeriod }),
        ])
        setAnalytics(analyticsData)
        setRankings(rankingsData)
        setReportData(reportsData)
        return { analytics, rankings, reportData }
    } catch (error) {
        console.error("Failed to fetch data:", error)
    }
  }

// Effect for fetching data (triggers on filter changes, not on pause/resume)
  useEffect(() => {
    fetchData()
  }, [timeRange, reportPeriod, selectedFactory, selectedBuilding, selectedFloor])

  // Effect for WebSocket setup (triggers on isRealTimeActive or filter changes)
  useEffect(() => {
    if (!isRealTimeActive) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    socketRef.current = io("http://localhost:5000", {
      query: {
        factoryId: selectedFactory ?? '',
        buildingId: selectedBuilding ?? '',
        floorId: selectedFloor ?? ''
      }
    })

    socketRef.current.on("connect", () => {
      console.log("Connected to WebSocket server")
    })

    socketRef.current.on("analytics-update", (data: AnalyticsData) => {
      setAnalytics((prev) => {
        // Filter new points to avoid duplicates (based on timestamp)
        const newPoints = data.trendData.filter(d => !prev.trendData.some(p => p.timestamp === d.timestamp))
        const updatedTrendData = [...prev.trendData, ...newPoints]
        // Maintain max 50 points
        while (updatedTrendData.length > 50) {
          updatedTrendData.shift()
        }
        console.log("Received analytics update", data, updatedTrendData);
        return {
          ...prev,
          ...data,  // Update other fields with new data
          trendData: updatedTrendData  // Keep old + new points
        }
      })
    })

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from WebSocket server")
    })

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRealTimeActive, selectedFactory, selectedBuilding, selectedFloor])

  const resetChart = () => {
    setAnalytics((prev) => ({
      ...prev,
      trendData: [], // Clear trendData
    }))
  }
    const toggleRealTime = () => {
        setIsRealTimeActive(!isRealTimeActive)
    }
    const getEfficiencyColor = (efficiency: number) => {
        if (efficiency >= 90) return "text-green-600"
        if (efficiency >= 80) return "text-yellow-600"
        return "text-red-600"
    }

    const getRankIcon = (index: number) => {
        if (index === 0) return <Award className="h-4 w-4 text-yellow-500" />
        if (index === 1) return <Award className="h-4 w-4 text-gray-400" />
        if (index === 2) return <Award className="h-4 w-4 text-amber-600" />
        return <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
    }
  
  return (
    <MainLayout>
      <div className="space-y-6 bg-gradient-to-br from-gray-50 to-orange-50 min-h-screen p-6 -m-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t("analytics.title")}
            </h1>
            <p className="text-gray-600 mt-2">Comprehensive energy analytics and performance insights</p>
          </div>
          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 border-2 border-orange-200 focus:border-orange-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">{t("analytics.lastHour")}</SelectItem>
                <SelectItem value="24h">{t("analytics.last24h")}</SelectItem>
                <SelectItem value="7d">{t("analytics.last7days")}</SelectItem>
                <SelectItem value="30d">{t("analytics.last30days")}</SelectItem>
                <SelectItem value="1y">{t("analytics.lastYear")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchData}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            >
              {t("analytics.refreshData")}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t("analytics.overview")}</TabsTrigger>
            <TabsTrigger onClick={fetchData} value="reports">{t("analytics.reports")}</TabsTrigger>
            <TabsTrigger onClick={fetchData} value="rankings">{t("analytics.rankings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">
                    {t("analytics.totalEnergyConsumption")}
                  </CardTitle>
                  <Zap className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalEnergyConsumption.toFixed(2)} kWh</div>
                  <div className="flex items-center text-xs text-white/80">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +5.2% from last period
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">
                    {t("analytics.averagePowerFactor")}
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.averagePowerFactor.toFixed(3)}</div>
                  <div className="flex items-center text-xs text-white/80">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -0.5% from last period
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">{t("analytics.loadFactor")}</CardTitle>
                  <PieChart className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.loadFactor.toFixed(1)}%</div>
                  <div className="flex items-center text-xs text-white/80">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2.1% from last period
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/90">{t("analytics.systemUptime")}</CardTitle>
                  <Clock className="h-4 w-4 text-white/80" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.uptimePercentage.toFixed(1)}%</div>
                  <div className="flex items-center text-xs text-white/80">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +0.8% from last period
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Power Consumption Trend */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-orange-600" />
                      {t("analytics.powerConsumptionTrend")} - Real-time
                    </CardTitle>
                    <CardDescription>Live power consumption with real-time updates</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleRealTime}
                      className={`${
                        isRealTimeActive
                          ? "bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {isRealTimeActive ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetChart}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between space-x-1 relative">
                  {analytics.trendData && analytics.trendData.length > 0 ? (
                    analytics.trendData.map((data, index) => {
                      const maxPower = Math.max(...analytics.trendData.map((d) => d.power), 1)
                      const height = maxPower > 0 ? (data.power / maxPower) * 100 : 0
                      const isLatest = index === analytics.trendData.length - 1
                      const colors = [
                        "bg-gradient-to-t from-orange-500 to-orange-400",
                        "bg-gradient-to-t from-red-500 to-red-400",
                        "bg-gradient-to-t from-yellow-500 to-yellow-400",
                        "bg-gradient-to-t from-pink-500 to-pink-400",
                      ]
                      const colorClass = colors[index % colors.length]

                      return (
                        <div
                          key={`${data.timestamp}-${index}`}
                          className={`${colorClass} rounded-t flex-1 min-h-[4px] transition-all duration-500 ease-in-out cursor-pointer relative group ${
                            isLatest && isRealTimeActive ? "animate-pulse shadow-lg" : ""
                          } ${isRealTimeActive ? "hover:opacity-80" : "hover:opacity-80"}`}
                          style={{
                            height: `${Math.max(height, 2)}%`,
                            // transform: isLatest && isRealTimeActive ? "scale(1.05)" : "scale(1)",
                          }}
                          title={`${data.time}: ${data.power.toFixed(2)} kW`}
                        >
                          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            <div>{data.power.toFixed(2)} kW</div>
                            <div className="text-xs opacity-80">{data.time}</div>
                          </div>
                          {isLatest && isRealTimeActive && (
                            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No trend data available
                    </div>
                  )}

                  {/* Real-time indicator */}
                  {isRealTimeActive && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>{analytics.trendData && analytics.trendData.length > 0 ? analytics.trendData[0]?.time : "Start"}</span>
                  <span className="text-center">
                    {isRealTimeActive ? "Real-time Updates" : "Paused"} •{analytics.trendData ? analytics.trendData.length : 0} data points
                  </span>
                  <span>Now</span>
                </div>

                {/* Current metrics */}
                <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{(analytics.currentPower || 0).toFixed(2)} kW</div>
                    <div className="text-xs text-gray-600">Current Power</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">{analytics.peakDemand.toFixed(2)} kW</div>
                    <div className="text-xs text-gray-600">Peak Demand</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{analytics.energyEfficiency.toFixed(1)}%</div>
                    <div className="text-xs text-gray-600">{t("analytics.efficiency")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Device Performance */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  {t("analytics.topDevicePerformance")}
                </CardTitle>
                <CardDescription>Efficiency and uptime metrics for key devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.devicePerformance && analytics.devicePerformance.length > 0 ? (
                    analytics.devicePerformance.map((device, index) => {
                      const colors = [
                        "from-blue-500 to-blue-600",
                        "from-green-500 to-green-600",
                        "from-purple-500 to-purple-600",
                        "from-orange-500 to-orange-600",
                        "from-pink-500 to-pink-600",
                      ]
                      const colorClass = colors[index % colors.length]

                      return (
                        <div
                          key={device.deviceId}
                          className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r ${colorClass} text-white shadow-lg`}
                        >
                          <div>
                            <div className="font-medium">{device.deviceName}</div>
                            <div className="text-sm text-white/80">
                              {t("analytics.energy")}: {device.energyUsage.toFixed(1)} kWh/day
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-lg font-bold">{device.efficiency.toFixed(1)}%</div>
                              <div className="text-xs text-white/80">{t("analytics.efficiency")}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold">{device.uptime.toFixed(1)}%</div>
                              <div className="text-xs text-white/80">{t("analytics.uptime")}</div>
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-0">
                              {device.efficiency >= 90
                                ? t("analytics.excellent")
                                : device.efficiency >= 80
                                  ? t("analytics.good")
                                  : t("analytics.needsAttention")}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No device performance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            <TabsContent value="reports" className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-2xl font-bold">{t("analytics.performanceReports")}</h2>
                <p className="text-gray-600">Historical data analysis and trends</p>
                </div>
                <div className="flex gap-4">
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                    <SelectTrigger className="w-40">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="day">{t("analytics.daily")}</SelectItem>
                    <SelectItem value="week">{t("analytics.weekly")}</SelectItem>
                    <SelectItem value="3months">3 {t("analytics.monthly")}</SelectItem>
                    <SelectItem value="year">{t("analytics.yearly")}</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    {t("analytics.export")}
                </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Power Consumption Report */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    {t("analytics.powerConsumption")}
                </CardTitle>
                <CardDescription>
                    {reportPeriod} {t("analytics.report")}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="h-48 flex items-end justify-between space-x-1">
                    {reportData.powerConsumption && reportData.powerConsumption.length > 0 ? (
                    reportData.powerConsumption.map((data, index) => {
                        const maxValue = Math.max(...reportData.powerConsumption.map((d) => d.value))
                        const height = (data.value / maxValue) * 100

                    return (
                        <div
                        key={index}
                        className="bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t flex-1 min-h-[4px] hover:opacity-80 transition-all cursor-pointer relative group"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${data.date}: ${data.value.toFixed(1)} kWh`}
                        >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {data.value.toFixed(1)} kWh
                        </div>
                        </div>
                    )
                    })) : (
                    <div className="text-gray-600">No data available</div>
                )}
                </div>
                <div className="mt-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                    {reportData.powerConsumption && reportData.powerConsumption.length > 0 ? (
                        reportData.powerConsumption.reduce((sum, d) => sum + d.value, 0).toFixed(1)
                    ) : (
                        0
                    )} kWh
                    </div>
                    <div className="text-sm text-gray-600">{t("analytics.totalConsumption")}</div>
                </div>
                </CardContent>
            </Card>

            {/* Uptime Report */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    {t("analytics.uptime")}
                </CardTitle>
                <CardDescription>
                    {reportPeriod} {t("analytics.report")}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="h-48 flex items-end justify-between space-x-1">
                    {reportData.uptime && reportData.uptime.length > 0 ? (
                        reportData.uptime.map((data, index) => {
                    const height = data.value

                    return (
                        <div
                        key={index}
                        className="bg-gradient-to-t from-green-500 to-green-400 rounded-t flex-1 min-h-[4px] hover:opacity-80 transition-all cursor-pointer relative group"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${data.date}: ${data.value.toFixed(1)}%`}
                        >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {data.value.toFixed(1)}%
                        </div>
                        </div>
                    )
                    })) : (
                    <div className="text-gray-600">No data available</div>
                )}
                </div>
                <div className="mt-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                    {reportData.uptime && reportData.uptime.length > 0 ? (
                        (reportData.uptime.reduce((sum, d) => sum + d.value, 0) / reportData.uptime.length).toFixed(1)
                    ) : (
                        0
                    )}%
                    </div>
                    <div className="text-sm text-gray-600">{t("analytics.averageUptime")}</div>
                </div>
                </CardContent>
            </Card>

            {/* Downtime Report */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    {t("analytics.downtime")}
                </CardTitle>
                <CardDescription>
                    {reportPeriod} {t("analytics.report")}
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="h-48 flex items-end justify-between space-x-1">
                    {reportData.downtime && reportData.downtime.length > 0 ? (
                        reportData.downtime.map((data, index) => {
                    const maxValue = Math.max(...reportData.downtime.map((d) => d.value))
                    const height = maxValue > 0 ? (data.value / maxValue) * 100 : 0

                    return (
                        <div
                        key={index}
                        className="bg-gradient-to-t from-red-500 to-red-400 rounded-t flex-1 min-h-[4px] hover:opacity-80 transition-all cursor-pointer relative group"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${data.date}: ${data.value.toFixed(1)} hr`}
                        >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {data.value.toFixed(1)} hr
                        </div>
                        </div>
                    )
                    })) : (
                    <div className="text-gray-600">No data available</div>
                )}
                </div>
                <div className="mt-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                    {reportData.downtime && reportData.downtime.length > 0 ? (
                        (reportData.downtime.reduce((sum, d) => sum + d.value, 0) / reportData.downtime.length).toFixed(
                        1,
                    )) : (
                        0
                    )}{" "}
                    hr
                    </div>
                    <div className="text-sm text-gray-600">{t("analytics.averageDowntime")}</div>
                </div>
                </CardContent>
            </Card>
            </div>
        </TabsContent>

          <TabsContent value="rankings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">{t("analytics.performanceRankings")}</h2>
              <p className="text-gray-600">Top performers across all levels</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Building Rankings */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                    {t("analytics.topBuildings")}
                  </CardTitle>
                  <CardDescription>{t("analytics.rankedByEfficiency")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rankings.buildings.slice(0, 5).map((building, index) => (
                      <div key={building.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          <div>
                            <div className="font-medium">{building.name}</div>
                            <div className="text-sm text-gray-600">
                              {building.uptime.toFixed(1)}h {t("analytics.uptime")} • {building.alerts}{" "}
                              {t("analytics.alerts")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getEfficiencyColor(building.efficiency)}`}>
                            {building.efficiency.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">{building.powerConsumption.toFixed(1)} kWh</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Floor Rankings */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    {t("analytics.topFloors")}
                  </CardTitle>
                  <CardDescription>{t("analytics.rankedByEfficiency")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rankings.floors.slice(0, 5).map((floor, index) => (
                      <div key={floor.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          <div>
                            <div className="font-medium">{floor.name}</div>
                            <div className="text-sm text-gray-600">
                              {floor.buildingName} • {floor.alerts} {t("analytics.alerts")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getEfficiencyColor(floor.efficiency)}`}>
                            {floor.efficiency.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">{floor.powerConsumption.toFixed(1)} kWh</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Line Rankings */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    {t("analytics.topLines")}
                  </CardTitle>
                  <CardDescription>{t("analytics.rankedByEfficiency")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rankings.lines.slice(0, 5).map((line, index) => (
                      <div key={line.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          <div>
                            <div className="font-medium">{line.name}</div>
                            <div className="text-sm text-gray-600">
                              {line.floorName} • {line.alerts} {t("analytics.alerts")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getEfficiencyColor(line.efficiency)}`}>
                            {line.efficiency.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">{line.powerConsumption.toFixed(1)} kWh</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Device Rankings */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    {t("analytics.topDevices")}
                  </CardTitle>
                  <CardDescription>{t("analytics.rankedByEfficiency")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rankings.devices.slice(0, 5).map((device, index) => (
                      <div key={device.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          {getRankIcon(index)}
                          <div>
                            <div className="font-medium">{device.name}</div>
                            <div className="text-sm text-gray-600">
                              {device.lineName} • {device.alerts} {t("analytics.alerts")}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getEfficiencyColor(device.efficiency)}`}>
                            {device.efficiency.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">{device.powerConsumption.toFixed(1)} kWh</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">{t("analytics.mostUptime")}</p>
                      <p className="text-2xl font-bold">
                        {Math.max(...rankings.buildings.map((b) => b.uptime)).toFixed(1)}h
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-400 to-red-500 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">{t("analytics.mostDowntime")}</p>
                      <p className="text-2xl font-bold">
                        {Math.max(...rankings.buildings.map((b) => b.downtime)).toFixed(1)}h
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">{t("analytics.highestPower")}</p>
                      <p className="text-2xl font-bold">
                        {Math.max(...rankings.buildings.map((b) => b.powerConsumption)).toFixed(1)} kWh
                      </p>
                    </div>
                    <Zap className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-400 to-purple-500 text-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/80">{t("analytics.mostAlerts")}</p>
                      <p className="text-2xl font-bold">{Math.max(...rankings.buildings.map((b) => b.alerts))}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-white/80" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
