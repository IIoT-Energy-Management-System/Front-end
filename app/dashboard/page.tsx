"use client"

import AlertDetailModal from "@/components/AlertDetailModal";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BASE_API_URL, DashboardApiService, FactoryApiService, ShiftApiService } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { DashboardStats } from "@/lib/types";
import {
    Activity,
    AlertTriangle,
    Building,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { io } from "socket.io-client";

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [factories, setFactories] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<string | null>(null);
    const [selectedShift, setSelectedShift] = useState<string | null>(null);
    const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
    const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);


    useEffect(() => {
        fetchFactoriesAndShifts();
    }, []);

    useEffect(() => {
        fetchDashboardData();

        // Setup WebSocket connection for real-time updates
        const socket = io(BASE_API_URL);

        // Subscribe with current filters
        socket.emit('subscribe-dashboard', {
            factoryId: selectedFactory,
            shiftId: selectedShift
        });

        socket.on('dashboard-update', (newData: DashboardStats) => {
            setStats(newData);
            setIsRefreshing(false);
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [selectedFactory, selectedShift]);

    const fetchFactoriesAndShifts = async () => {
        try {
            const [factoriesRes, shiftsRes] = await Promise.all([
                FactoryApiService.getFactories(),
                ShiftApiService.getShifts()
            ]);
            setFactories(factoriesRes || []);
            setShifts(shiftsRes || []);
            // if (factoriesRes.ok) {
            //     const factoriesData = await factoriesRes.json();
            //     setFactories(factoriesData.data || []);
            // }
            
            // if (shiftsRes.ok) {
            //     const shiftsData = await shiftsRes.json();
            //     setShifts(shiftsData.data || []);
            // }
        } catch (err) {
            console.error('Error fetching factories/shifts:', err);
        }
    };

    const fetchDashboardData = async () => {
        setIsRefreshing(true);
        setError(null);
        try {
            // const params = new URLSearchParams();
            // if (selectedFactory) params.append('factoryId', selectedFactory);
            // if (selectedShift) params.append('shiftId', selectedShift);
            
            // const url = `http://localhost:5000/api/dashboard/overview${params.toString() ? '?' + params.toString() : ''}`;
            // const response = await fetch(url);
            // const data = await response.json();
            
            // if (data && data.success && data.data) {
            //     setStats(data.data);
            // } else {
            //     setError('Failed to fetch dashboard data');
            // }
            const response = await DashboardApiService.getDashboardOverview(selectedFactory || undefined, selectedShift || undefined);
            console.log('Dashboard data:', response);
            setStats(response);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError('Error loading dashboard data');
        } finally {
            setIsRefreshing(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Critical':
                return 'text-red-600 bg-red-100';
            case 'High':
                return 'text-purple-600 bg-purple-100';
            case 'Medium':
                return 'text-orange-600 bg-orange-100';
            case 'Low':
            default:
                return 'text-yellow-600 bg-yellow-100';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'warning':
                return 'text-orange-600 bg-orange-100';
            case 'critical':
                return 'text-red-600 bg-red-100';
            case 'normal':
            default:
                return 'text-green-600 bg-green-100';
        }
    };

    const toggleBuildingExpand = (buildingId: string) => {
        setExpandedBuildings(prev => {
            const newSet = new Set(prev);
            if (newSet.has(buildingId)) {
                newSet.delete(buildingId);
            } else {
                newSet.add(buildingId);
            }
            return newSet;
        });
    };

    if (error) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600">{error}</p>
                        <Button onClick={fetchDashboardData} className="mt-4">
                            Retry
                        </Button>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!stats) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                        <p>Loading dashboard...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const KPICard = ({ title, value, unit, description, trend, icon: Icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-l-4 ${color}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color.replace('border-', 'bg-').replace('500', '100')}`}>
            <Icon className={`h-6 w-6 ${color.replace('border-', 'text-')}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-gray-900">{value}</span>
              <span className="text-sm text-gray-500">{unit}</span>
            </div>
          </div>
        </div>
      </div>
      {description && (
        <div className="text-sm text-gray-500 mb-2">{description}</div>
      )}
      {trend !== undefined && (
        <div className="flex items-center gap-1 text-sm">
          {trend > 0 ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">+{trend}%</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-red-600 font-medium">{trend}%</span>
            </>
          )}
          <span className="text-gray-500 ml-1">so với hôm qua</span>
        </div>
      )}
    </div>
  );

    return (
        <MainLayout>
            <div className="space-y-6 min-h-screen p-2 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Energy Management Dashboard
                        </h1>
                        <p className="text-gray-600 mt-2">Real-time monitoring and analytics</p>
                        <p>{currentTime.toLocaleString("vi-VN")}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4 my-8">
                        {/* 1. Chọn xem Toàn bộ hay từng nhà máy */}
                        <div className="flex items-center gap-3 bg-white rounded-2xl shadow-lg p-2">
                            <button 
                                onClick={() => setSelectedFactory(null)}
                                className={`px-8 py-4 rounded-xl text-lg font-semibold transition-all ${
                                    selectedFactory === null 
                                    ? "bg-blue-600 text-white shadow-xl" 
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                Toàn công ty
                            </button>
                            {factories.map(f => (
                                <button 
                                    key={f.id} 
                                    onClick={() => setSelectedFactory(f.id)}
                                    className={`px-6 py-4 rounded-xl text-lg font-semibold transition-all ${
                                        selectedFactory === f.id 
                                        ? "bg-blue-600 text-white shadow-xl" 
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>

                        {/* 2. Chọn xem Ca nào */}
                        <div className="flex gap-3 bg-white rounded-2xl shadow-lg p-2">
                            <button 
                                onClick={() => setSelectedShift(null)}
                                className={`px-10 py-5 rounded-xl text-xl font-bold transition-all ${
                                    selectedShift === null 
                                    ? "bg-green-600 text-white shadow-xl" 
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                Tất cả ca
                            </button>
                            {shifts.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => setSelectedShift(s.id)}
                                    className={`px-8 py-5 rounded-xl text-lg font-bold transition-all ${
                                        selectedShift === s.id 
                                        ? "bg-green-600 text-white shadow-xl" 
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Building" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="building1">
                                <SelectItemText>Building 1</SelectItemText>
                            </SelectItem>
                            <SelectItem value="building2">
                                <SelectItemText>Building 2</SelectItemText>
                            </SelectItem>
                            <SelectItem value="all">
                                <SelectItemText>All Buildings</SelectItemText>
                            </SelectItem>
                        </SelectContent>
                    </Select> */}
                    <Button
                        onClick={fetchDashboardData}
                        disabled={isRefreshing}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        {t('common.refresh')}
                    </Button>
                </div>

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Current Power */}
                    {/* <Card className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-l-4 border-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/90">Current Power</CardTitle>
                            <Zap className="h-6 w-6 " />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{(stats.currentPower || 0).toFixed(2)} kW</div>
                            <div className={`flex items-center text-xs mt-2 ${(Number(stats.powerTrend) || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                {(Number(stats.powerTrend) || 0) >= 0 ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {(Number(stats.powerTrend) || 0) >= 0 ? '+' : ''}{(Number(stats.powerTrend) || 0).toFixed(1)}% from last period
                            </div>
                        </CardContent>
                    </Card> */}

                    <KPICard
                      title="Current Power"
                      value={(stats.currentPower || 0).toFixed(2)}
                      unit="kW"
                      trend={Number(stats.powerTrend) || 0}
                      icon={Zap}
                      color="border-blue-500"
                      onClick={() => window.location.href = '/analytics'}
                    />
                    {/* Monthly Cost */}
                    {/* <Card className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-l-4 border-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/90">Monthly Cost</CardTitle>
                            <Activity className="h-6 w-6 " />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.monthlyCost || 0)}
                            </div>
                            <div className={`flex items-center text-xs mt-2 ${(Number(stats.costTrend) || 0) <= 0 ? 'text-green-200' : 'text-red-200'}`}>
                                {(Number(stats.costTrend) || 0) <= 0 ? (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                ) : (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                )}
                                {(Number(stats.costTrend) || 0) >= 0 ? '+' : ''}{(Number(stats.costTrend) || 0).toFixed(1)}% from last month
                            </div>
                        </CardContent>
                    </Card> */}
                    <KPICard
                      title="Monthly Cost"
                      value={stats.monthlyCost > 1000000 ? stats.monthlyCost / 1000000 : (new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.monthlyCost || 0))}
                      unit={stats.monthlyCost > 1000000 ? 'triệu' : ''}
                      trend={Number(stats.costTrend) || 0}
                      icon={Activity}
                      color="border-green-500"
                      onClick={() => window.location.href = '/reports'}
                    />

                    {/* Active Alerts */}
                    {/* <Card className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-l-4 border-red-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/90">Active Alerts</CardTitle>
                            <AlertTriangle className="h-6 w-6 " />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.activeAlerts}</div>
                            <div className="text-xs  mt-2">Requires attention</div>
                        </CardContent>
                    </Card> */}
                    <KPICard
                      title="Active Alerts"
                      value={stats.activeAlerts || 0}
                      unit=""
                      icon={AlertTriangle}
                      color="border-red-500"
                      onClick={() => window.location.href = '/alerts'}
                    />

                    {/* System Uptime */}
                    {/* <Card className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-l-4 border-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-white/90">System Uptime</CardTitle>
                            <Activity className="h-6 w-6 " />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{(stats.uptime || 0).toFixed(1)}%</div>
                            <div className="text-xs  mt-2">Last 24 hours</div>
                        </CardContent>
                    </Card> */}
                    <KPICard
                      title="System Uptime"
                      value={(stats.uptime.uptime || 0).toFixed(1)}
                      unit="%"
                      description={"Hoat dong: " + (stats.uptime.runningMinutes || 0) + " phut / " + (stats.uptime.totalMinutes || 0) + " phut"}
                      icon={Activity}
                      color="border-purple-500"
                      onClick={() => window.location.href = '/devices'}
                    />
                </div>

                <div className="flex gap-2 lg:flex-row flex-col">
                {/* Power History Chart */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg lg:1/2 2xl:w-3/4">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Power Consumption History</CardTitle>
                            <CardDescription>Last 24 hours power trend</CardDescription>
                        </div>
                        <span className="text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => window.location.href = '/analytics'}>Xem chi tiet</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={stats.powerHistory || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#3b82f6" 
                                    strokeWidth={2}
                                    name="Power (kW)"
                                    dot={{ fill: '#3b82f6' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Alerts */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg lg:1/2 2xl:w-1/4">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                    Recent Alerts
                                </CardTitle>
                                <CardDescription>Latest system alerts and warnings</CardDescription>
                            </div>
                            <span className="text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => window.location.href = '/alerts'}>Xem chi tiet</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(stats.recentAlerts || []).length > 0 ? (
                                (stats.recentAlerts || []).map((alert) => (
                                    <button 
                                        key={alert.id} 
                                        onClick={() => setSelectedAlert(alert)}
                                        className="w-full flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={getSeverityColor(alert.severity)}>
                                                    {alert.severity}
                                                </Badge>
                                                <span className="text-sm text-gray-500">{alert.time}</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No recent alerts</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                </div>

                {/* Buildings Overview */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-blue-600" />
                            Buildings Overview
                        </CardTitle>
                        <CardDescription>Power consumption by building</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(stats.buildings || []).map((building) => (
                                <Card key={building.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold text-lg">{building.name}</h3>
                                            <Badge className={getStatusColor(building.status)}>
                                                {building.status}
                                            </Badge>
                                        </div>
                                        
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Power:</span>
                                                <span className="font-medium text-blue-600">{(Number(building.power) || 0).toFixed(1)} kW</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Total Devices:</span>
                                                <span className="font-medium">{building.devices}</span>
                                            </div>
                                            {building.warningDevices && building.warningDevices.length > 0 && (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Offline Devices:</span>
                                                        <span className="font-medium text-red-600">{building.warningDevices.length}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleBuildingExpand(building.id)}
                                                        className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors text-sm font-medium text-red-700"
                                                    >
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <span>{expandedBuildings.has(building.id) ? 'Hide' : 'Show'} Offline Devices</span>
                                                        {expandedBuildings.has(building.id) ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Warning Devices Section - Collapsible */}
                                        {building.warningDevices && building.warningDevices.length > 0 && expandedBuildings.has(building.id) && (
                                            <div className="border-t pt-3 animate-in slide-in-from-top-2 duration-200">
                                                <div className="space-y-2 max-h-60 overflow-y-auto">{building.warningDevices.map((device) => (
                                                        <div 
                                                            key={device.id} 
                                                            className="bg-red-50 border border-red-200 rounded p-2 hover:bg-red-100 transition-colors cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.location.href = `/devices?deviceId=${device.id}`;
                                                            }}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">{device.name}</p>
                                                                    <p className="text-xs text-gray-500">{device.type}</p>
                                                                    {device.lastSeen && (
                                                                        <p className="text-xs text-gray-400 mt-1">
                                                                            Last seen: {new Date(device.lastSeen).toLocaleString('vi-VN', {
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <Badge variant="destructive" className="text-xs">
                                                                    {device.status}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert Detail Modal */}
            <AlertDetailModal 
                alert={selectedAlert} 
                onClose={() => setSelectedAlert(null)} 
            />
        </MainLayout>
    );
}
