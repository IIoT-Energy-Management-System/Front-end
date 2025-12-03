// "use client"

// import { MainLayout } from "@/components/layout/main-layout";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { DashboardApiService } from "@/lib/api";
// import { useTranslation } from "@/lib/i18n";
// import { DashboardStats } from "@/lib/types";
// import {
//     Activity,
//     AlertCircle,
//     AlertTriangle,
//     Building,
//     TrendingDown,
//     TrendingUp,
//     Zap,
//     RefreshCw,
//     DollarSign,
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import { io } from 'socket.io-client';

// export default function DashboardPage() {
//   const [stats, setStats] = useState<DashboardStats>({
//     currentPower: 0,
//     powerTrend: 0,
//     monthlyCost: 0,
//     costTrend: 0,
//     activeAlerts: 0,
//     uptime: 0,
//     buildings: [],
//     recentAlerts: [],
//     powerHistory: []
//   })
//   const [isRefreshing, setIsRefreshing] = useState(false)
//   const { t } = useTranslation()

// // //   const [factories, setFactories] = useState<typeFactory[]>([])
// // //   const [buildings, setBuildings] = useState<typeBuilding[]>([])
// // //   const [floors, setFloors] = useState<Floor[]>([])
//   useEffect(() => {
//     fetchDashboardData();
//     const socket = io('http://localhost:5000');

//     socket.on('dashboard-update', (newData) => {
//       setStats(newData);
//       setIsRefreshing(false);
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, [])

//   const fetchDashboardData = async () => {
// //     setIsRefreshing(true)
// //     try {
// //       const response = await DashboardApiService.getDashboardOverview()
// //       if (response && response.success && response.data) {
// //         const apiData = response.data
// //         setStats({
// //           totalPower: apiData.totalPower ?? 0,
// //           totalDevices: apiData.totalDevices ?? 0,
// //           onlineDevices: apiData.onlineDevices ?? 0,
// //           activeAlerts: apiData.activeAlerts ?? 0,
// //           operationalTime: apiData.operationalTime ?? {
// //             runningTime: 0,
// //             breakTime: 0,
// //             errorTime: 0,
// //             totalShiftTime: 0,
// //           },
// //           powerByBuilding: apiData.powerByBuilding ?? [],
// //           powerTrend: apiData.powerTrend ?? [],
// //           trendLines: apiData.trendLines ?? [],
// //           operationalByShift: apiData.operationalByShift ?? [],
// //           realTimeOperationalStatus: apiData.realTimeOperationalStatus ?? [],
// //         })
// //       }
// //     } catch (error) {
// //       console.error("Error fetching dashboard data:", error)
// //     } finally {
// //       setIsRefreshing(false)
// //     }
// //   }

// //   const trendPower = (before: DashboardStats[], after: DashboardStats[], t: any) => {
// //     const lastBefore = before[before.length - 1];
// //     const lastAfter = after[after.length - 1];
// //     if (lastBefore && lastAfter && lastBefore.totalPower !== 0) {
// //       const delta = ((lastAfter.totalPower - lastBefore.totalPower) / lastBefore.totalPower) * 100;
// //       const isIncrease = delta > 0;
// //       const color = isIncrease ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-white';
// //       const icon = isIncrease ? <TrendingUp className="h-3 w-3 mr-1" /> : delta < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />;
// //       return (
// //         <div className={`flex items-center text-xs ${color} mt-2`}>
// //           {icon}
// //           {delta > 0 ? '+' : ''}{delta.toFixed(1)}% {t('trend.deltaFromPrevHour')}
// //         </div>
// //       );
// //     } else {
// //       return (
// //         <div className="flex items-center text-xs text-white mt-2">
// //           <TrendingUp className="h-3 w-3 mr-1" />
// //           0% {t('trend.deltaFromPrevHour')}
// //         </div>
// //       );
// //     }
// //   }

// // //   const fetchFactories = async () => {
// // //     try {
// // //       const response = await FactoryApiService.getFactories()
// // //       if (response && response.success && response.data) {
// // //         const apiData = response.data
// // //         setFactories(apiData)
// // //       }
// // //     } catch (error) {
// // //       console.error("Error fetching factory data:", error)
// // //     }
// // //   }

// // //   const fetchBuildings = async (factoryId: string) => {
// // //     try {
// // //       const response = await BuildingApiService.getBuildingsByFactory(factoryId)
// // //       if (response && response.success && response.data) {
// // //         const apiData = response.data
// // //         setBuildings(apiData)
// // //       }
// // //     } catch (error) {
// // //       console.error("Error fetching building data:", error)
// // //     }
// // //   }

// // //   const fetchFloors = async (buildingId: string) => {
// // //     try {
// // //       const response = await FloorApiService.getFloorsByBuilding(buildingId)
// // //       if (response && response.success && response.data) {
// // //         const apiData = response.data
// // //         setFloors(apiData)
// // //       }
// // //     } catch (error) {
// // //       console.error("Error fetching floor data:", error)
// // //     }
// // //   }

// //     const formatTime = (minutes: number) => {
// //     const hours = Math.floor(minutes / 60);
// //     const mins = Math.round(minutes % 60);
// //     return `${hours}:${mins.toString().padStart(2, '0')}`;
// //     };
// //     const colors = [
// //         "rgb(59, 130, 246)", // blue
// //         "rgb(34, 197, 94)", // green
// //         "rgb(168, 85, 247)", // purple
// //         "rgb(249, 115, 22)", // orange
// //         "rgb(236, 72, 153)", // pink
// //         "rgb(99, 102, 241)", // indigo
// //         "rgb(239, 68, 68)", // red
// //         "rgb(245, 158, 11)", // yellow
// //     ]

// //     const getOperationalStatusColor = (status: "running" | "break" | "error" | "idle") => {
// //         switch (status) {
// //         case "running":
// //             return "text-green-600 bg-green-100"
// //         case "break":
// //             return "text-blue-600 bg-blue-100"
// //         case "error":
// //             return "text-red-600 bg-red-100"
// //         case "idle":
// //             return "text-gray-600 bg-gray-100"
// //         default:
// //             return "text-gray-600 bg-gray-100"
// //         }
// //     }

// //   const getOperationalStatusIcon = (status: "running" | "break" | "error" | "idle") => {
// //     switch (status) {
// //       case "running":
// //         return <Play className="h-4 w-4" />
// //       case "break":
// //         return <Coffee className="h-4 w-4" />
// //       case "error":
// //         return <AlertCircle className="h-4 w-4" />
// //       case "idle":
// //         return <Pause className="h-4 w-4" />
// //       default:
// //         return <Timer className="h-4 w-4" />
// //     }
// //   }

// //   const handleChartClick = (dataPoint: {
// //     time: string
// //     power: number
// //     efficiency: number
// //     operationalStatus: string
// //     lineName?: string
// //   }) => {
// //     setSelectedDataPoint(dataPoint)
// //   }

// //   // SVG Line Chart Component with Operational Status
// //   const LineChartSVG = ({ chartWidth, chartHeight }: { chartWidth: number; chartHeight: number }) => {
// //     const padding = 60

// //     if (stats.trendLines.length === 0) return null

// //     const allPowerValues = stats.trendLines.flatMap((line) => line.data.map((d) => d.power))
// //     let maxPower = allPowerValues.length > 0 ? Math.max(...allPowerValues) : 1
// //     // Avoid division by zero if maxPower is 0
// //     if (maxPower === 0) maxPower = 1

// //     // Create path for each line with different styles based on operational status
// //     const createPath = (
// //       data: Array<{
// //         time: string
// //         power: number
// //         efficiency: number
// //         operationalStatus: "running" | "break" | "error" | "idle"
// //       }>,
// //     ) => {
// //       return data
// //         .map((point, index) => {
// //           const x =
// //             data.length > 1
// //               ? padding + (index * (chartWidth - 2 * padding)) / (data.length - 1)
// //               : padding + (chartWidth - 2 * padding) / 2 // Center if only one point
// //           const y = chartHeight - padding - (point.power / maxPower) * (chartHeight - 2 * padding)
// //           return `${index === 0 ? "M" : "L"} ${x} ${y}`
// //         })
// //         .join(" ")
// //     }

// //     const getStatusColor = (status: "running" | "break" | "error" | "idle") => {
// //       switch (status) {
// //         case "running":
// //           return "#10b981" // green
// //         case "break":
// //           return "#3b82f6" // blue
// //         case "error":
// //           return "#ef4444" // red
// //         case "idle":
// //           return "#6b7280" // gray
// //         default:
// //           return "#6b7280"
// //       }
// //     }

// //     return (
// //       <div className="w-full overflow-x-auto">
// //         <svg width={chartWidth} height={chartHeight + 40} className="w-full h-auto">
// //           {/* Grid lines */}
// //           <defs>
// //             <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
// //               <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
// //             </pattern>
// //           </defs>
// //           <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />

// //           {/* Y-axis labels */}
// //           {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
// //             <g key={ratio}>
// //               <line
// //                 x1={padding}
// //                 y1={chartHeight - padding - ratio * (chartHeight - 2 * padding)}
// //                 x2={chartWidth - padding}
// //                 y2={chartHeight - padding - ratio * (chartHeight - 2 * padding)}
// //                 stroke="#e5e7eb"
// //                 strokeWidth="1"
// //                 opacity="0.3"
// //               />
// //               <text
// //                 x={padding - 10}
// //                 y={chartHeight - padding - ratio * (chartHeight - 2 * padding) + 5}
// //                 textAnchor="end"
// //                 fontSize="12"
// //                 fill="#6b7280"
// //               >
// //                 {(maxPower * ratio).toFixed(0)}
// //               </text>
// //             </g>
// //           ))}

// //           {/* X-axis labels */}
// //           {stats.trendLines[0]?.data.map((point, index) => {
// //             if (index % 4 === 0) {
// //               const numPoints = stats.trendLines[0].data.length
// //               const x =
// //                 numPoints > 1
// //                   ? padding + (index * (chartWidth - 2 * padding)) / (numPoints - 1)
// //                   : padding + (chartWidth - 2 * padding) / 2 // Center if only one point
// //               return (
// //                 <text key={index} x={x} y={chartHeight - padding + 20} textAnchor="middle" fontSize="12" fill="#6b7280">
// //                   {point.time}
// //                 </text>
// //               )
// //             }
// //             return null
// //           })}

// //           {/* Lines */}
// //           {stats.trendLines.map((line, lineIndex) => (
// //             <g key={line.id}>
// //               <path
// //                 d={createPath(line.data)}
// //                 fill="none"
// //                 stroke={colors[lineIndex % colors.length]}
// //                 strokeWidth="3"
// //                 strokeLinecap="round"
// //                 strokeLinejoin="round"
// //                 className="hover:stroke-4 transition-all cursor-pointer"
// //               />
// //               {/* Data points with operational status colors */}
// //               {line.data.map((point, pointIndex) => {
// //                 const x =
// //                   line.data.length > 1
// //                     ? padding + (pointIndex * (chartWidth - 2 * padding)) / (line.data.length - 1)
// //                     : padding + (chartWidth - 2 * padding) / 2 // Center if only one point
// //                 const y = chartHeight - padding - (point.power / maxPower) * (chartHeight - 2 * padding)
// //                 return (
// //                   <circle
// //                     key={pointIndex}
// //                     cx={x}
// //                     cy={y}
// //                     r="6"
// //                     fill={getStatusColor(point.operationalStatus)}
// //                     stroke="white"
// //                     strokeWidth="2"
// //                     className="hover:r-8 transition-all cursor-pointer"
// //                     onClick={() =>
// //                       handleChartClick({
// //                         time: point.time,
// //                         power: point.power,
// //                         efficiency: point.efficiency,
// //                         operationalStatus: point.operationalStatus,
// //                         lineName: line.name,
// //                       })
// //                     }
// //                   >
// //                     <title>{`${line.name}: ${point.power.toFixed(2)} kW at ${point.time} (${point.operationalStatus})`}</title>
// //                   </circle>
// //                 )
// //               })}
// //             </g>
// //           ))}

// //           {/* Axis lines */}
// //           <line
// //             x1={padding}
// //             y1={chartHeight - padding}
// //             x2={chartWidth - padding}
// //             y2={chartHeight - padding}
// //             stroke="#374151"
// //             strokeWidth="2"
// //           />
// //           <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#374151" strokeWidth="2" />

// //           {/* Axis labels */}
// //           <text
// //             x={chartWidth / 2}
// //             y={chartHeight + 35}
// //             textAnchor="middle"
// //             fontSize="14"
// //             fill="#374151"
// //             fontWeight="600"
// //           >
// //             {t("dashboard.xaxis.time")}
// //           </text>
// //           <text
// //             x={20}
// //             y={chartHeight / 2}
// //             textAnchor="middle"
// //             fontSize="14"
// //             fill="#374151"
// //             fontWeight="600"
// //             transform={`rotate(-90, 20, ${chartHeight / 2})`}
// //           >
// //             {t("dashboard.yaxis.power")}
// //           </text>
// //         </svg>
// //       </div>
// //     )
// //   }

// // const timeToString = (time: string) => {
// //     // Handles ISO string like "2025-08-28T23:00:00.000Z"
// //     const date = new Date(time)
// //     const hours = date.getHours().toString().padStart(2, "0")
// //     const minutes = date.getMinutes().toString().padStart(2, "0")
// //     return `${hours}:${minutes}`
// // }

// //   return (
// //     <MainLayout>
// //       <div className="space-y-6 min-h-screen p-2 sm:p-6">
// //         {/* Header */}
// //         <div className="flex items-center justify-between">
// //           <div>
// //             <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
// //               {t('dashboard.operationalTitle')}
// //             </h1>
// //             <p className="text-gray-600 mt-2">{t('dashboard.operationalSubtitle')}</p>
// //           </div>
// //           <Button
// //             onClick={fetchDashboardData}
// //             disabled={isRefreshing}
// //             className="hidden sm:flex bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
// //           >
// //             <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
// //             {t('common.refresh')}
// //           </Button>
// //         </div>

// //         {/* Filters */}
// //         {/* <div className="flex flex-wrap gap-4">
// //           <Select
// //             value={selectedFactory || "all"}
// //             onValueChange={(value) => {
// //               setSelectedFactory(value === "all" ? null : value)
// //               if (value !== "all") {
// //                 fetchBuildings(value)
// //               }
// //             }}
// //           >
// //             <SelectTrigger className="w-48 bg-white border-2 border-blue-200 focus:border-blue-400">
// //               <SelectValue placeholder={t('filters.selectFactory')} />
// //             </SelectTrigger>
// //             <SelectContent>
// //               <SelectItem value="all">{t('filters.allFactories')}</SelectItem>
// //               {factories.map((factory) => (
// //                 <SelectItem key={factory.id} value={factory.id}>
// //                   {factory.name}
// //                 </SelectItem>
// //               ))}
// //             </SelectContent>
// //           </Select>

// //           {selectedFactory && (
// //             <Select
// //               value={selectedBuilding || "all"}
// //               onValueChange={(value) => {
// //                 setSelectedBuilding(value === "all" ? null : value)
// //                 if (value !== "all") {
// //                   fetchFloors(value)
// //                 }
// //                   }}
// //             >
// //               <SelectTrigger className="w-48 bg-white border-2 border-green-200 focus:border-green-400">
// //                 <SelectValue placeholder={t('filters.selectBuilding')} />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 <SelectItem value="all">{t('filters.allBuildings')}</SelectItem>
// //                 {buildings.map((building) => (
// //                   <SelectItem key={building.id} value={building.id}>
// //                     {building.name}
// //                   </SelectItem>
// //                 ))}
// //               </SelectContent>
// //             </Select>
// //           )}

// //           {selectedBuilding && (
// //             <Select
// //               value={selectedFloor || "all"}
// //               onValueChange={(value) => setSelectedFloor(value === "all" ? null : value)}
// //             >
// //               <SelectTrigger className="w-48 bg-white border-2 border-purple-200 focus:border-purple-400">
// //                 <SelectValue placeholder={t('filters.selectFloor')} />
// //               </SelectTrigger>
// //               <SelectContent>
// //                 <SelectItem value="all">{t('filters.allFloors')}</SelectItem>
// //                 {floors.map((floor) => (
// //                     <SelectItem key={floor.id} value={floor.id}>
// //                       {floor.name}
// //                     </SelectItem>
// //                   ))}
// //               </SelectContent>
// //             </Select>
// //           )}
// //         </div> */}

// //         {/* Main Operational Time Cards */}
// //         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //           <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
// //             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //               <CardTitle className="text-sm font-medium text-white/90">{t('cards.runningTime')}</CardTitle>
// //               <Play className="h-6 w-6 text-white/80" />
// //             </CardHeader>
// //             <CardContent>
// //               <div className="text-3xl font-bold">{formatTime(stats.operationalTime.runningTime)} {t('units.hours')}</div>
// //               <div className="text-lg font-medium mt-1">
// //                 {((stats.operationalTime.runningTime / stats.operationalTime.totalShiftTime) * 100).toFixed(1)}% {t('common.percentOfShiftSuffix')}
// //               </div>
// //               <div className="flex items-center text-xs text-white/80 mt-2">
// //                 <TrendingUp className="h-3 w-3 mr-1" />
// //                 {t('cards.runningSubtitle')}
// //               </div>
// //             </CardContent>
// //           </Card>

// //           <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
// //             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //               <CardTitle className="text-sm font-medium text-white/90">{t('cards.breakTime')}</CardTitle>
// //               <Coffee className="h-6 w-6 text-white/80" />
// //             </CardHeader>
// //             <CardContent>
// //               <div className="text-3xl font-bold">{formatTime(stats.operationalTime.breakTime)} {t('units.hours')}</div>
// //               <div className="text-lg font-medium mt-1">
// //                 {((stats.operationalTime.breakTime / stats.operationalTime.totalShiftTime) * 100).toFixed(1)}% {t('common.percentOfShiftSuffix')}
// //               </div>
// //               <div className="text-xs text-white/80 mt-2">{t('cards.breakDescription')}</div>
// //             </CardContent>
// //           </Card>

// //           <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
// //             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //               <CardTitle className="text-sm font-medium text-white/90">{t('cards.errorTime')}</CardTitle>
// //               <AlertCircle className="h-6 w-6 text-white/80" />
// //             </CardHeader>
// //             <CardContent>
// //               <div className="text-3xl font-bold">{formatTime(stats.operationalTime.errorTime)} {t('units.hours')}</div>
// //               <div className="text-lg font-medium mt-1">
// //                 {((stats.operationalTime.errorTime / stats.operationalTime.totalShiftTime) * 100).toFixed(1)}% {t('common.percentOfShiftSuffix')}
// //               </div>
// //               <div className="text-xs text-white/80 mt-2">{t('cards.errorDescription')}</div>
// //             </CardContent>
// //           </Card>
// //         </div>

// //         {/* Secondary Stats Cards */}
// //         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
// //           <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
// //             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //               <CardTitle className="text-sm font-medium text-white/90">{t('dashboard.totalPower')}</CardTitle>
// //               <Zap className="h-6 w-6 text-white/80" />
// //             </CardHeader>
// //             <CardContent>
// //               <div className="text-2xl font-bold">{stats.totalPower.toFixed(2)} kW</div>
// //               {trendPower(before, after, t)}
// //             </CardContent>
// //           </Card>

// //           <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
// //             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //               <CardTitle className="text-sm font-medium text-white/90">{t('dashboard.totalDevices')}</CardTitle>
// //               <Cpu className="h-6 w-6 text-white/80" />
// //             </CardHeader>
// //             <CardContent>
// //               <div className="text-2xl font-bold">{stats.totalDevices}</div>
// //               <div className="text-xs text-white/80 mt-2">{t('devices.allLocations')}</div>
// //             </CardContent>
// //           </Card>

// //           <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0 shadow-lg">
// //             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //               <CardTitle className="text-sm font-medium text-white/90">{t('dashboard.onlineDevices')}</CardTitle>
// //               <Activity className="h-6 w-6 text-white/80" />
// //             </CardHeader>
// //             <CardContent>
// //               <div className="text-2xl font-bold">{stats.onlineDevices}</div>
// //               <div className="text-xs text-white/80 mt-2">
// //                 {stats.totalDevices > 0 ? ((stats.onlineDevices / stats.totalDevices) * 100).toFixed(1) : 0}% {t('common.active')}
// //               </div>
// //             </CardContent>
// //           </Card>

// //           <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-lg">
// //             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
// //               <CardTitle className="text-sm font-medium text-white/90">{t('dashboard.alerts')}</CardTitle>
// //               <AlertTriangle className="h-6 w-6 text-white/80" />
// //             </CardHeader>
// //             <CardContent>
// //               <div className="text-2xl font-bold">{stats.activeAlerts}</div>
// //               <div className="text-xs text-white/80 mt-2">{t('alerts.needsAttention')}</div>
// //             </CardContent>
// //           </Card>
// //         </div>

// //         {/* Interactive Power Trend Line Chart with Operational Status */}
// //         <Card ref={detailsPanelRef} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
// //           <CardHeader>
// //             <CardTitle className="flex items-center gap-2">
// //               <LineChart className="h-5 w-5 text-blue-600" />
// //               {t('dashboard.trend.title')}
// //             </CardTitle>
// //             <CardDescription>{t('dashboard.trend.description')}</CardDescription>
// //           </CardHeader>
// //           <CardContent>
// //             {stats.trendLines.length > 0 ? (
// //               <LineChartSVG chartWidth={chartWidth} chartHeight={chartHeight} />
// //             ) : (
// //               <div className="h-80 flex items-center justify-center text-gray-500">
// //                 <div className="text-center">
// //                   <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
// //                   <p>{t('common.noData')}</p>
// //                 </div>
// //               </div>
// //             )}

// //             {/* Legend with Operational Status */}
// //             {stats.trendLines.length > 0 && (
// //               <div className="mt-6 space-y-4">
// //                 <div className="flex flex-wrap gap-4 justify-center">
// //                   {stats.trendLines.map((line, lineIndex) => (
// //                     <div key={line.id} className="flex items-center space-x-2">
// //                       <div
// //                         className="w-4 h-4 rounded-full"
// //                         style={{ backgroundColor: colors[lineIndex % colors.length] }}
// //                       ></div>
// //                       <span className="text-sm font-medium">{line.name}</span>
// //                     </div>
// //                   ))}
// //                 </div>

// //                 {/* Operational Status Legend */}
// //                 <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
// //                   <div className="flex items-center space-x-2">
// //                     <div className="w-4 h-4 rounded-full bg-green-500"></div>
// //                     <span className="text-sm">{t('status.running')}</span>
// //                   </div>
// //                   <div className="flex items-center space-x-2">
// //                     <div className="w-4 h-4 rounded-full bg-blue-500"></div>
// //                     <span className="text-sm">{t('status.break')}</span>
// //                   </div>
// //                   <div className="flex items-center space-x-2">
// //                     <div className="w-4 h-4 rounded-full bg-red-500"></div>
// //                     <span className="text-sm">{t('status.error')}</span>
// //                   </div>
// //                   <div className="flex items-center space-x-2">
// //                     <div className="w-4 h-4 rounded-full bg-gray-500"></div>
// //                     <span className="text-sm">{t('status.idle')}</span>
// //                   </div>
// //                 </div>
// //               </div>
// //             )}

// //             {/* Selected Data Point Details */}
// //             {selectedDataPoint && (
// //               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
// //                 <h4 className="font-semibold text-blue-900 mb-2">
// //                   {t('detail.title')} - {selectedDataPoint.time}
// //                   {selectedDataPoint.lineName && ` (${selectedDataPoint.lineName})`}
// //                 </h4>
// //                 <div className="grid grid-cols-4 gap-4 text-sm">
// //                   <div>
// //                     <span className="text-gray-600">{t('detail.power')}:</span>
// //                     <div className="font-bold text-blue-600">{selectedDataPoint.power.toFixed(2)} kW</div>
// //                   </div>
// //                   <div>
// //                     <span className="text-gray-600">{t('detail.efficiency')}:</span>
// //                     <div className="font-bold text-green-600">{selectedDataPoint.efficiency.toFixed(1)}%</div>
// //                   </div>
// //                   <div>
// //                     <span className="text-gray-600">{t('detail.status')}:</span>
// //                     <div className="font-bold text-orange-600">
// //                       {selectedDataPoint.operationalStatus === "running"
// //                         ? t('status.running')
// //                         : selectedDataPoint.operationalStatus === "break"
// //                           ? t('status.break')
// //                           : selectedDataPoint.operationalStatus === "error"
// //                             ? t('status.error')
// //                             : t('status.idle')}
// //                     </div>
// //                   </div>
// //                   <div>
// //                     <span className="text-gray-600">{t('detail.energy1h')}:</span>
// //                     <div className="font-bold text-purple-600">{selectedDataPoint.power.toFixed(2)} kWh</div>
// //                   </div>
// //                 </div>
// //               </div>
// //             )}
// //           </CardContent>
// //         </Card>

// //         {/* Operational Time by Shift */}
// //         <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
// //           <CardHeader>
// //             <CardTitle className="flex items-center gap-2">
// //               <Clock className="h-5 w-5 text-green-600" />
// //               {t('dashboard.shift.title')}
// //             </CardTitle>
// //             <CardDescription>{t('dashboard.shift.description')}</CardDescription>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="space-y-6">
// //               {stats.operationalByShift.map((shift, index) => {
// //                 const hue = (index * 60) % 360
// //                 const backgroundColor = `hsl(${hue}, 70%, 60%)`
// //                 return (
// //                   <div
// //                     key={shift.name}
// //                     className="p-6 rounded-xl text-white shadow-lg"
// //                     style={{ background: backgroundColor }}
// //                   >
// //                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
// //                     <h3 className="text-xl font-bold">
// //                         {shift.name || "Unknown"} ({timeToString(shift.start) || "00:00"} - {timeToString(shift.end) || "00:00"})
// //                     </h3>
// //                     <Badge className="bg-white/20 text-white border-0 text-lg px-3 py-1">
// //                       {shift.runningPercentOfShift}% {t('layouts.efficiency')}
// //                     </Badge>
// //                   </div>

// //                   <div className="grid grid-rows-3 sm:grid-cols-3 sm:grid-rows-1 gap-6">
// //                     <div className="text-center">
// //                         <div className="flex items-center justify-center mb-2">
// //                         <Play className="h-6 w-6 mr-2" />
// //                         <span className="text-lg font-semibold">{t('cards.runningTime')}</span>
// //                       </div>
// //                         <div className="text-3xl font-bold">{formatTime(shift.runningMinutes)} {t('units.hours')}</div>
// //                         <div className="text-sm text-white/80">
// //                         {shift.runningPercentOfShift}% {t('common.percentOfShiftSuffix')}
// //                       </div>
// //                     </div>

// //                     <div className="text-center">
// //                         <div className="flex items-center justify-center mb-2">
// //                         <Coffee className="h-6 w-6 mr-2" />
// //                         <span className="text-lg font-semibold">{t('cards.breakTime')}</span>
// //                       </div>
// //                       <div className="text-3xl font-bold">{formatTime(shift.breakMinutes)} {t('units.hours')}</div>
// //                       <div className="text-sm text-white/80">
// //                         {shift.breakPercentOfShift}% {t('common.percentOfShiftSuffix')}
// //                       </div>
// //                     </div>

// //                     <div className="text-center">
// //                         <div className="flex items-center justify-center mb-2">
// //                         <AlertCircle className="h-6 w-6 mr-2" />
// //                         <span className="text-lg font-semibold">{t('cards.errorTime')}</span>
// //                       </div>
// //                       <div className="text-3xl font-bold">{formatTime(shift.errorMinutes)} {t('units.hours')}</div>
// //                       <div className="text-sm text-white/80">
// //                         {shift.errorPercentOfShift}% {t('common.percentOfShiftSuffix')}
// //                       </div>
// //                     </div>
// //                   </div>

// //                   <div className="mt-4">
// //                     <Progress value={shift.runningPercentOfShift} className="h-3 bg-white/20" />
// //                   </div>
// //                 </div>
// //                 )
// //               })}
// //             </div>
// //           </CardContent>
// //         </Card>

// //         {/* Real-time Device Operational Status */}
// //         <Card className="hidden sm:block bg-white/80 backdrop-blur-sm border-0 shadow-lg">
// //           <CardHeader>
// //             <CardTitle className="flex items-center gap-2">
// //               <Timer className="h-5 w-5 text-orange-600" />
// //               {t('dashboard.realtimeDevices.title')}
// //             </CardTitle>
// //             <CardDescription>{t('dashboard.realtimeDevices.description')}</CardDescription>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
// //               {stats.realTimeOperationalStatus.map((device, index) => {
// //                 const statusColor = getOperationalStatusColor(device.status)
// //                 const statusIcon = getOperationalStatusIcon(device.status)

// //                 return (
// //                   <div
// //                     key={device.deviceId}
// //                     className="p-4 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-all cursor-pointer bg-white"
// //                   >
// //                     <div className="flex items-center justify-between mb-3">
// //                       <div className="flex items-center gap-2">
// //                         {statusIcon}
// //                         <Cpu className="h-5 w-5 text-gray-600" />
// //                       </div>
// //                       <Badge className={`${statusColor} border-0 text-xs`}>
// //                         {device.status === "running"
// //                           ? t('status.running')
// //                           : device.status === "break"
// //                             ? t('status.break')
// //                             : device.status === "error"
// //                               ? t('status.error')
// //                               : t('status.idle')}
// //                       </Badge>
// //                     </div>

// //                     <div className="space-y-3">
// //                       <h4 className="font-medium text-sm truncate">{device.deviceName}</h4>

// //                       <div className="space-y-2 text-xs">
// //                         <div className="flex justify-between">
// //                           <span className="text-gray-600">{t('cards.runningTime')}:</span>
// //                           <span className="font-medium text-green-600">{formatTime(device.runningMinutes)} {t('units.hours')}</span>
// //                         </div>
// //                         <div className="flex justify-between">
// //                           <span className="text-gray-600">{t('cards.breakTime')}:</span>
// //                           <span className="font-medium text-blue-600">{formatTime(device.breakMinutes)} {t('units.hours')}</span>
// //                         </div>
// //                         <div className="flex justify-between">
// //                           <span className="text-gray-600">{t('cards.errorTime')}:</span>
// //                           <span className="font-medium text-red-600">{formatTime(device.errorMinutes)} {t('units.hours')}</span>
// //                         </div>
// //                       </div>

// //                       <div className="pt-2">
// //                         <Progress value={device.runningPercent} className="h-2" />
// //                         <div className="text-xs text-gray-600 mt-1 text-center">
// //                           {device.runningPercent}% {t('layouts.efficiency')}
// //                         </div>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 )
// //               })}
// //             </div>
// //           </CardContent>
// //         </Card>

// //         {/* Power Usage by Factories with Operational Time */}
// //         <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
// //           <CardHeader>
// //             <CardTitle className="flex items-center gap-2">
// //               <Building className="h-5 w-5 text-indigo-600" />
// //               {t('building.title')}
// //             </CardTitle>
// //             <CardDescription>{t('building.description')}</CardDescription>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
// //               {stats.powerByBuilding.length > 0 ? (
// //                 stats.powerByBuilding.map((building, index) => {
// //                   const hue = (index * 60) % 360
// //                   const backgroundColor = `hsl(${hue}, 70%, 60%)`

// //                   return (
// //                     <div
// //                       key={building.name}
// //                       className="p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
// //                       style={{ backgroundColor }}
// //                     >
// //                       <div className="flex items-center justify-between mb-4">
// //                         <Factory className="h-8 w-8 text-white/80" />
// //                         <Badge variant="secondary" className="bg-white/20 text-white border-0">
// //                           {building.devices} {t('building.devicesLabel')}
// //                         </Badge>
// //                       </div>

// //                       <div className="space-y-4">
// //                         <div>
// //                           <h3 className="font-semibold text-lg mb-2">{building.name}</h3>
// //                           <div className="text-2xl font-bold">{building.power.toFixed(2)} kW</div>
// //                           <div className="text-sm text-white/80">{(building.power * 24).toFixed(1)} {t('building.kwhPerDay')}</div>
// //                         </div>

// //                         <div className="grid grid-cols-3 gap-2 text-xs">
// //                           <div className="text-center">
// //                             <div className="font-semibold">{t('building.label.running')}</div>
// //                             <div>{formatTime(building.operationalTime.runningTime)} {t('units.hours')}</div>
// //                           </div>
// //                           <div className="text-center">
// //                             <div className="font-semibold">{t('building.label.break')}</div>
// //                             <div>{formatTime(building.operationalTime.breakTime)} {t('units.hours')}</div>
// //                           </div>
// //                           <div className="text-center">
// //                             <div className="font-semibold">{t('building.label.error')}</div>
// //                             <div>{formatTime(building.operationalTime.errorTime)} {t('units.hours')}</div>
// //                           </div>
// //                         </div>

// //                         <Progress
// //                           value={Math.min((building.power / stats.totalPower) * 100, 100)}
// //                           className="h-2 bg-white/20"
// //                         />
// //                       </div>
// //                     </div>
// //                   )
// //                 })
// //               ) : (
// //                 <div className="col-span-full text-center py-8 text-gray-500">
// //                   <p>{t('common.noData')}</p>
// //                 </div>
// //               )}
// //             </div>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     </MainLayout>
// //   )
// // }
// import React, { useState, useEffect } from 'react';
// import { TrendingUp, TrendingDown, Zap, AlertTriangle, Activity, ChevronRight, Clock, DollarSign } from 'lucide-react';
// import { MainLayout } from '@/components/layout/main-layout';
// import { DashboardStats } from '@/lib/types';
// import { DashboardApiService } from '@/lib/api';

// // Mock data - replace with API calls
// // const mockData = {
// //   currentPower: 1247.5,
// //   powerTrend: 5.2,
// //   monthlyCost: 187500000,
// //   costTrend: -3.1,
// //   activeAlerts: 3,
// //   uptime: 96.8,
// //   buildings: [
// //     { id: '1', name: 'Tòa A - Cắt May', power: 542.3, status: 'normal', devices: 45 },
// //     { id: '2', name: 'Tòa B - Hoàn Thiện', power: 398.7, status: 'warning', devices: 38 },
// //     { id: '3', name: 'Tòa C - Đóng Gói', power: 306.5, status: 'normal', devices: 32 }
// //   ],
// //   recentAlerts: [
// //     { id: '1', message: 'Máy cắt #12 vượt ngưỡng công suất', time: '5 phút trước', severity: 'high' },
// //     { id: '2', message: 'Điện áp thấp tại Tầng 3 - Tòa B', time: '15 phút trước', severity: 'medium' },
// //     { id: '3', message: 'Nhiệt độ cao tại máy là #8', time: '23 phút trước', severity: 'low' }
// //   ],
// //   powerHistory: [
// //     { time: '06:00', value: 1150 },
// //     { time: '08:00', value: 1280 },
// //     { time: '10:00', value: 1320 },
// //     { time: '12:00', value: 1180 },
// //     { time: '14:00', value: 1290 },
// //     { time: '16:00', value: 1250 }
// //   ]
// // };

// const ExecutiveDashboard = () => {
//   const [data, setData] = useState<DashboardStats>(
//     {
//         currentPower: 1247.5,
//   powerTrend: 5.2,
//   monthlyCost: 187500000,
//   costTrend: -3.1,
//   activeAlerts: 3,
//   uptime: 96.8,
//   buildings: [
//     { id: '1', name: 'Tòa A - Cắt May', power: 542.3, status: 'normal', devices: 45 },
//     { id: '2', name: 'Tòa B - Hoàn Thiện', power: 398.7, status: 'warning', devices: 38 },
//     { id: '3', name: 'Tòa C - Đóng Gói', power: 306.5, status: 'normal', devices: 32 }
//   ],
//   recentAlerts: [
//     { id: '1', message: 'Máy cắt #12 vượt ngưỡng công suất', time: '5 phút trước', severity: 'high' },
//     { id: '2', message: 'Điện áp thấp tại Tầng 3 - Tòa B', time: '15 phút trước', severity: 'medium' },
//     { id: '3', message: 'Nhiệt độ cao tại máy là #8', time: '23 phút trước', severity: 'low' }
//   ],
//   powerHistory: [
//     { time: '06:00', value: 1150 },
//     { time: '08:00', value: 1280 },
//     { time: '10:00', value: 1320 },
//     { time: '12:00', value: 1180 },
//     { time: '14:00', value: 1290 },
//     { time: '16:00', value: 1250 }
//   ]
//     }
//   );
//   const [selectedPeriod, setSelectedPeriod] = useState('today');

//     useEffect(() => {
//     // Fetch data from API and set state
//     const fetchData = async () => {
//         const response = await DashboardApiService.getDashboardOverview();
//         console.log('Dashboard Data:', response);
//         setData(response);
//     }
//     fetchData();
//     }, []);

//   // Main KPI Card Component
//   const KPICard = ({ title, value, unit, trend, icon: Icon, color, onClick }) => (
//     <div 
//       onClick={onClick}
//       className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-l-4 ${color}`}
//     >
//       <div className="flex items-start justify-between mb-3">
//         <div className="flex items-center gap-3">
//           <div className={`p-2 rounded-lg ${color.replace('border-', 'bg-').replace('500', '100')}`}>
//             <Icon className={`h-6 w-6 ${color.replace('border-', 'text-')}`} />
//           </div>
//           <div>
//             <p className="text-sm text-gray-500 font-medium">{title}</p>
//             <div className="flex items-baseline gap-2 mt-1">
//               <span className="text-3xl font-bold text-gray-900">{value}</span>
//               <span className="text-sm text-gray-500">{unit}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//       {trend !== undefined && (
//         <div className="flex items-center gap-1 text-sm">
//           {trend > 0 ? (
//             <>
//               <TrendingUp className="h-4 w-4 text-green-600" />
//               <span className="text-green-600 font-medium">+{trend}%</span>
//             </>
//           ) : (
//             <>
//               <TrendingDown className="h-4 w-4 text-red-600" />
//               <span className="text-red-600 font-medium">{trend}%</span>
//             </>
//           )}
//           <span className="text-gray-500 ml-1">so với hôm qua</span>
//         </div>
//       )}
//     </div>
//   );

//   // Building Card for drill-down
//   const BuildingCard = ({ building }) => (
//     <div 
//       onClick={() => window.location.href = `/layouts?building=${building.id}`}
//       className="bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer border border-gray-100"
//     >
//       <div className="flex items-center justify-between mb-3">
//         <h4 className="font-semibold text-gray-900">{building.name}</h4>
//         <ChevronRight className="h-5 w-5 text-gray-400" />
//       </div>
//       <div className="space-y-2">
//         <div className="flex items-center justify-between">
//           <span className="text-2xl font-bold text-gray-900">{building.power}</span>
//           <span className="text-sm text-gray-500">kW</span>
//         </div>
//         <div className="flex items-center justify-between text-sm">
//           <span className="text-gray-500">{building.devices} thiết bị</span>
//           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//             building.status === 'normal' 
//               ? 'bg-green-100 text-green-700' 
//               : 'bg-yellow-100 text-yellow-700'
//           }`}>
//             {building.status === 'normal' ? 'Bình thường' : 'Cảnh báo'}
//           </span>
//         </div>
//       </div>
//     </div>
//   );

//   // Simple trend chart
//   const TrendChart = () => {
//     const max = Math.max(...data.powerHistory.map(d => d.value));
//     const min = Math.min(...data.powerHistory.map(d => d.value));
//     const range = max - min;

//     return (
//       <div className="bg-white rounded-xl shadow-sm p-6">
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-lg font-semibold text-gray-900">Xu hướng công suất hôm nay</h3>
//           <select 
//             value={selectedPeriod}
//             onChange={(e) => setSelectedPeriod(e.target.value)}
//             className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="today">Hôm nay</option>
//             <option value="week">7 ngày</option>
//             <option value="month">30 ngày</option>
//           </select>
//         </div>
//         <div className="h-48 flex items-end gap-2">
//           {data.powerHistory.map((point, idx) => {
//             const height = range > 0 ? ((point.value - min) / range) * 100 : 50;
//             return (
//               <div key={idx} className="flex-1 flex flex-col items-center gap-2">
//                 <div 
//                   className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative group"
//                   style={{ height: `${Math.max(height, 10)}%` }}
//                 >
//                   <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
//                     {point.value} kW
//                   </div>
//                 </div>
//                 <span className="text-xs text-gray-500">{point.time}</span>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };

//   // Alert list
//   const AlertsList = () => (
//     <div className="bg-white rounded-xl shadow-sm p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-semibold text-gray-900">Cảnh báo gần đây</h3>
//         <button 
//           onClick={() => window.location.href = '/alerts'}
//           className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
//         >
//           Xem tất cả
//           <ChevronRight className="h-4 w-4" />
//         </button>
//       </div>
//       <div className="space-y-3">
//         {data.recentAlerts.map(alert => (
//           <div 
//             key={alert.id}
//             className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
//           >
//             <div className={`p-1 rounded-full mt-0.5 ${
//               alert.severity === 'high' ? 'bg-red-100' :
//               alert.severity === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
//             }`}>
//               <AlertTriangle className={`h-4 w-4 ${
//                 alert.severity === 'high' ? 'text-red-600' :
//                 alert.severity === 'medium' ? 'text-yellow-600' : 'text-gray-600'
//               }`} />
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-medium text-gray-900">{alert.message}</p>
//               <p className="text-xs text-gray-500 mt-0.5">{alert.time}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );

//   return (
//     <MainLayout>
//        <div className="space-y-6 min-h-screen p-2 sm:p-6">
//       {/* Header */}
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 mb-2">
//           Dashboard Giám Sát Năng Lượng
//         </h1>
//         <p className="text-gray-500">
//           Cập nhật lúc {new Date().toLocaleTimeString('vi-VN')}
//         </p>
//       </div>

//       {/* Main KPIs - Only 4 most important metrics */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//         <KPICard
//           title="Công suất hiện tại"
//           value={data.currentPower}
//           unit="kW"
//           trend={data.powerTrend}
//           icon={Zap}
//           color="border-blue-500"
//           onClick={() => window.location.href = '/analytics'}
//         />
//         <KPICard
//           title="Chi phí tháng này"
//           value={(data.monthlyCost / 1000000).toFixed(1)}
//           unit="triệu VNĐ"
//           trend={data.costTrend}
//           icon={DollarSign}
//           color="border-green-500"
//           onClick={() => window.location.href = '/reports'}
//         />
//         <KPICard
//           title="Cảnh báo"
//           value={data.activeAlerts}
//           unit="đang hoạt động"
//           icon={AlertTriangle}
//           color="border-red-500"
//           onClick={() => window.location.href = '/alerts'}
//         />
//         <KPICard
//           title="Uptime"
//           value={data.uptime}
//           unit="%"
//           icon={Activity}
//           color="border-purple-500"
//           onClick={() => window.location.href = '/devices'}
//         />
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//         {/* Trend Chart - Takes 2 columns */}
//         <div className="lg:col-span-2">
//           <TrendChart />
//         </div>

//         {/* Alerts - Takes 1 column */}
//         <div>
//           <AlertsList />
//         </div>
//       </div>

//       {/* Buildings Overview - Drill-down entry point */}
//       <div className="bg-white rounded-xl shadow-sm p-6">
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-lg font-semibold text-gray-900">Tổng quan theo tòa nhà</h3>
//           <button 
//             onClick={() => window.location.href = '/layouts'}
//             className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
//           >
//             Xem chi tiết
//             <ChevronRight className="h-4 w-4" />
//           </button>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {data.buildings.map(building => (
//             <BuildingCard key={building.id} building={building} />
//           ))}
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <div className="mt-8 flex gap-4">
//         <button 
//           onClick={() => window.location.href = '/reports'}
//           className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
//         >
//           Tạo báo cáo
//         </button>
//         <button 
//           onClick={() => window.location.href = '/devices'}
//           className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
//         >
//           Quản lý thiết bị
//         </button>
//       </div>
//     </div>
//     </MainLayout>
//   );
// };

// export default ExecutiveDashboard;