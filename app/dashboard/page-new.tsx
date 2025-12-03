// "use client"

// import { MainLayout } from "@/components/layout/main-layout";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { DashboardApiService } from "@/lib/api";
// import { useTranslation } from "@/lib/i18n";
// import { DashboardStats } from "@/lib/types";
// import {
//     Activity,
//     AlertTriangle,
//     Building,
//     RefreshCw,
//     TrendingDown,
//     TrendingUp,
//     Zap,
// } from "lucide-react";
// import { useEffect, useState } from "react";
// import {
//     CartesianGrid,
//     Legend,
//     Line,
//     LineChart,
//     ResponsiveContainer,
//     Tooltip,
//     XAxis,
//     YAxis
// } from 'recharts';
// import { io } from 'socket.io-client';

// export default function DashboardPage() {
//     const [stats, setStats] = useState<DashboardStats | null>(null);
//     const [isRefreshing, setIsRefreshing] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const { t } = useTranslation();

//     useEffect(() => {
//         fetchDashboardData();

//         // Setup WebSocket connection for real-time updates
//         const socket = io('http://localhost:5000');

//         socket.on('dashboard-update', (newData: DashboardStats) => {
//             setStats(newData);
//             setIsRefreshing(false);
//         });

//         // Cleanup on unmount
//         return () => {
//             socket.disconnect();
//         };
//     }, []);

//     const fetchDashboardData = async () => {
//         setIsRefreshing(true);
//         setError(null);
//         try {
//             const response = await DashboardApiService.getDashboardOverview();
//             if (response && response.success && response.data) {
//                 setStats(response.data);
//             } else {
//                 setError('Failed to fetch dashboard data');
//             }
//         } catch (err) {
//             console.error("Error fetching dashboard data:", err);
//             setError('Error loading dashboard data');
//         } finally {
//             setIsRefreshing(false);
//         }
//     };

//     const getSeverityColor = (severity: string) => {
//         switch (severity) {
//             case 'critical':
//             case 'high':
//                 return 'text-red-600 bg-red-100';
//             case 'medium':
//                 return 'text-orange-600 bg-orange-100';
//             case 'low':
//             default:
//                 return 'text-yellow-600 bg-yellow-100';
//         }
//     };

//     const getStatusColor = (status: string) => {
//         switch (status) {
//             case 'warning':
//                 return 'text-orange-600 bg-orange-100';
//             case 'critical':
//                 return 'text-red-600 bg-red-100';
//             case 'normal':
//             default:
//                 return 'text-green-600 bg-green-100';
//         }
//     };

//     if (error) {
//         return (
//             <MainLayout>
//                 <div className="flex items-center justify-center min-h-screen">
//                     <div className="text-center">
//                         <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//                         <p className="text-red-600">{error}</p>
//                         <Button onClick={fetchDashboardData} className="mt-4">
//                             Retry
//                         </Button>
//                     </div>
//                 </div>
//             </MainLayout>
//         );
//     }

//     if (!stats) {
//         return (
//             <MainLayout>
//                 <div className="flex items-center justify-center min-h-screen">
//                     <div className="text-center">
//                         <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
//                         <p>Loading dashboard...</p>
//                     </div>
//                 </div>
//             </MainLayout>
//         );
//     }

//     return (
//         <MainLayout>
//             <div className="space-y-6 min-h-screen p-2 sm:p-6">
//                 {/* Header */}
//                 <div className="flex items-center justify-between">
//                     <div>
//                         <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                             Energy Management Dashboard
//                         </h1>
//                         <p className="text-gray-600 mt-2">Real-time monitoring and analytics</p>
//                     </div>
//                     <Button
//                         onClick={fetchDashboardData}
//                         disabled={isRefreshing}
//                         className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
//                     >
//                         <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
//                         {t('common.refresh')}
//                     </Button>
//                 </div>

//                 {/* Main Stats Cards */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                     {/* Current Power */}
//                     <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                             <CardTitle className="text-sm font-medium text-white/90">Current Power</CardTitle>
//                             <Zap className="h-6 w-6 text-white/80" />
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-3xl font-bold">{stats.currentPower.toFixed(2)} kW</div>
//                             <div className={`flex items-center text-xs mt-2 ${stats.powerTrend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
//                                 {stats.powerTrend >= 0 ? (
//                                     <TrendingUp className="h-3 w-3 mr-1" />
//                                 ) : (
//                                     <TrendingDown className="h-3 w-3 mr-1" />
//                                 )}
//                                 {stats.powerTrend >= 0 ? '+' : ''}{stats.powerTrend.toFixed(1)}% from last period
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Monthly Cost */}
//                     <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                             <CardTitle className="text-sm font-medium text-white/90">Monthly Cost</CardTitle>
//                             <Activity className="h-6 w-6 text-white/80" />
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-3xl font-bold">
//                                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.monthlyCost)}
//                             </div>
//                             <div className={`flex items-center text-xs mt-2 ${stats.costTrend <= 0 ? 'text-green-200' : 'text-red-200'}`}>
//                                 {stats.costTrend <= 0 ? (
//                                     <TrendingDown className="h-3 w-3 mr-1" />
//                                 ) : (
//                                     <TrendingUp className="h-3 w-3 mr-1" />
//                                 )}
//                                 {stats.costTrend >= 0 ? '+' : ''}{stats.costTrend.toFixed(1)}% from last month
//                             </div>
//                         </CardContent>
//                     </Card>

//                     {/* Active Alerts */}
//                     <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                             <CardTitle className="text-sm font-medium text-white/90">Active Alerts</CardTitle>
//                             <AlertTriangle className="h-6 w-6 text-white/80" />
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-3xl font-bold">{stats.activeAlerts}</div>
//                             <div className="text-xs text-white/80 mt-2">Requires attention</div>
//                         </CardContent>
//                     </Card>

//                     {/* System Uptime */}
//                     <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
//                         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                             <CardTitle className="text-sm font-medium text-white/90">System Uptime</CardTitle>
//                             <Activity className="h-6 w-6 text-white/80" />
//                         </CardHeader>
//                         <CardContent>
//                             <div className="text-3xl font-bold">{stats.uptime.toFixed(1)}%</div>
//                             <div className="text-xs text-white/80 mt-2">Last 24 hours</div>
//                         </CardContent>
//                     </Card>
//                 </div>

//                 {/* Buildings Overview */}
//                 <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
//                     <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                             <Building className="h-5 w-5 text-blue-600" />
//                             Buildings Overview
//                         </CardTitle>
//                         <CardDescription>Power consumption by building</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                             {stats.buildings.map((building) => (
//                                 <Card key={building.id} className="hover:shadow-md transition-shadow">
//                                     <CardContent className="pt-6">
//                                         <div className="flex items-center justify-between mb-2">
//                                             <h3 className="font-semibold">{building.name}</h3>
//                                             <Badge className={getStatusColor(building.status)}>
//                                                 {building.status}
//                                             </Badge>
//                                         </div>
//                                         <div className="space-y-2">
//                                             <div className="flex justify-between text-sm">
//                                                 <span className="text-gray-600">Power:</span>
//                                                 <span className="font-medium">{building.power.toFixed(1)} kW</span>
//                                             </div>
//                                             <div className="flex justify-between text-sm">
//                                                 <span className="text-gray-600">Devices:</span>
//                                                 <span className="font-medium">{building.devices}</span>
//                                             </div>
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             ))}
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Power History Chart */}
//                 <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
//                     <CardHeader>
//                         <CardTitle>Power Consumption History</CardTitle>
//                         <CardDescription>Last 24 hours power trend</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <ResponsiveContainer width="100%" height={300}>
//                             <LineChart data={stats.powerHistory}>
//                                 <CartesianGrid strokeDasharray="3 3" />
//                                 <XAxis dataKey="time" />
//                                 <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
//                                 <Tooltip />
//                                 <Legend />
//                                 <Line 
//                                     type="monotone" 
//                                     dataKey="value" 
//                                     stroke="#3b82f6" 
//                                     strokeWidth={2}
//                                     name="Power (kW)"
//                                     dot={{ fill: '#3b82f6' }}
//                                 />
//                             </LineChart>
//                         </ResponsiveContainer>
//                     </CardContent>
//                 </Card>

//                 {/* Recent Alerts */}
//                 <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
//                     <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                             <AlertTriangle className="h-5 w-5 text-red-600" />
//                             Recent Alerts
//                         </CardTitle>
//                         <CardDescription>Latest system alerts and warnings</CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="space-y-4">
//                             {stats.recentAlerts.length > 0 ? (
//                                 stats.recentAlerts.map((alert) => (
//                                     <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
//                                         <div className="flex-1">
//                                             <div className="flex items-center gap-2 mb-1">
//                                                 <Badge className={getSeverityColor(alert.severity)}>
//                                                     {alert.severity}
//                                                 </Badge>
//                                                 <span className="text-sm text-gray-500">{alert.time}</span>
//                                             </div>
//                                             <p className="text-sm font-medium text-gray-900">{alert.message}</p>
//                                         </div>
//                                     </div>
//                                 ))
//                             ) : (
//                                 <div className="text-center py-8 text-gray-500">
//                                     <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
//                                     <p>No recent alerts</p>
//                                 </div>
//                             )}
//                         </div>
//                     </CardContent>
//                 </Card>
//             </div>
//         </MainLayout>
//     );
// }
