"use client"


import { MainLayout } from "@/components/layout/main-layout"
import { PermissionGuard } from "@/components/PermissionGuard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { db } from "@/lib/database"
import { useTranslation } from "@/lib/i18n"
// import { useAppStore } from "@/lib/store"
// import type { RolePermissions } from "@/lib/types"
import { useAppStore } from "@/lib/store"
import { useState } from "react"
import Backup from "./layouts/Backup"
import DatabaseSettings from "./layouts/DatabaseSettings"
import EnergySettings from "./layouts/EnergySettings"
import Logs from "./layouts/Logs"
import NotificationSettings from "./layouts/NotificationSettings"
import RolePermissionManager from "./layouts/RolePermissionManager"
import ShiftManagement from "./layouts/ShiftManagement"
import UserManagement from "./layouts/UserManagement"

export default function AdminPage() {
    const { user } = useAppStore()
  const [activeTab, setActiveTab] = useState(user?.permissions?.includes("user.view") ? "users" : "database")
//   const [rolePermissions, setRolePermissions] = useState<Map<string, RolePermissions>>(new Map())
//   const [isRolePermissionDialogOpen, setIsRolePermissionDialogOpen] = useState(false)
//   const [selectedRole, setSelectedRole] = useState<string>("")

//   const { factories } = useAppStore()
  const { t } = useTranslation()

//   const loadRolePermissions = async () => {
//     try {
//       const roles = ["Admin", "Supervisor", "Operator", "Viewer"]
//       const permissions = new Map<string, RolePermissions>()

//       for (const role of roles) {
//         const rolePerms = await db.getRolePermissions(role)
//         if (rolePerms) {
//           permissions.set(role, rolePerms)
//         }
//       }

//       setRolePermissions(permissions)
//     } catch (error) {
//       console.error("Failed to load role permissions:", error)
//     }
//   }

//   useEffect(() => {
//     loadRolePermissions()
//   }, [])

//   const handleUpdateRolePermissions = async () => {
//     if (!selectedRole) return

//     const permissions = rolePermissions.get(selectedRole)
//     if (!permissions) return

//     try {
//       await db.updateRolePermissions(selectedRole, permissions)
//       setIsRolePermissionDialogOpen(false)
//       setSelectedRole("")
//       loadRolePermissions()
//     } catch (error) {
//       console.error("Failed to update role permissions:", error)
//     }
//   }

//   const openRolePermissions = (role: string) => {
//     setSelectedRole(role)
//     setIsRolePermissionDialogOpen(true)
//   }

//   const updateRolePermission = (permission: keyof RolePermissions, value: any) => {
//     if (!selectedRole) return

//     const currentPermissions = rolePermissions.get(selectedRole)
//     if (!currentPermissions) return

//     const updatedPermissions = { ...currentPermissions, [permission]: value }
//     const newRolePermissions = new Map(rolePermissions)
//     newRolePermissions.set(selectedRole, updatedPermissions)
//     setRolePermissions(newRolePermissions)
//   }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("settings.title")}</h1>
            <p className="text-gray-600">{t("settings.description")}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex overflow-x-auto pb-2 *:w-full">
            <PermissionGuard permission="user.view">
              <TabsTrigger value="users">{t("settings.users")}</TabsTrigger>
            </PermissionGuard>
            <PermissionGuard permission="role.view">
              <TabsTrigger value="roles">{t("settings.roles")}</TabsTrigger>
            </PermissionGuard>
            <PermissionGuard permission="settings.view">
              <TabsTrigger value="database">{t("settings.database")}</TabsTrigger>
              <TabsTrigger value="notifications">{t("settings.notifications")}</TabsTrigger>
              <TabsTrigger value="energy">{t("settings.energy")}</TabsTrigger>
              <TabsTrigger value="shifts">{t("settings.shifts")}</TabsTrigger>
              <TabsTrigger value="backup">{t("settings.backup")}</TabsTrigger>
            </PermissionGuard>
            <PermissionGuard permission="log.view">
              <TabsTrigger value="logs">{t("settings.logs")}</TabsTrigger>
            </PermissionGuard>
          </TabsList>

          {/* User Management */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          {/* Role Management */}
          <TabsContent value="roles" className="space-y-6">
            <RolePermissionManager />
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Quản Lý Vai Trò & Quyền Hạn
                </CardTitle>
                <CardDescription>Cấu hình quyền hạn cho từng vai trò người dùng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from(rolePermissions.entries()).map(([role, permissions]) => (
                    <Card key={role} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {role === "Admin"
                            ? "Quản Trị Viên"
                            : role === "Supervisor"
                              ? "Giám Sát Viên"
                              : role === "Operator"
                                ? "Vận Hành Viên"
                                : "Người Xem"}
                        </CardTitle>
                        <CardDescription>
                          {role === "Admin" && "Quyền truy cập toàn hệ thống"}
                          {role === "Supervisor" && "Quyền truy cập cấp quản lý"}
                          {role === "Operator" && "Quyền truy cập vận hành"}
                          {role === "Viewer" && "Quyền truy cập chỉ đọc"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Bảng Điều Khiển</span>
                            <Badge variant={permissions.canViewDashboard ? "default" : "secondary"}>
                              {permissions.canViewDashboard ? "✓" : "✗"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Sửa Thiết Bị</span>
                            <Badge variant={permissions.canEditDevices ? "default" : "secondary"}>
                              {permissions.canEditDevices ? "✓" : "✗"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Sửa Bố Cục</span>
                            <Badge variant={permissions.canEditLayouts ? "default" : "secondary"}>
                              {permissions.canEditLayouts ? "✓" : "✗"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Quyền Quản Trị</span>
                            <Badge variant={permissions.canAccessAdmin ? "default" : "secondary"}>
                              {permissions.canAccessAdmin ? "✓" : "✗"}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4 bg-transparent"
                          onClick={() => openRolePermissions(role)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Cấu Hình
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database" className="space-y-6">
            <DatabaseSettings />
          </TabsContent>

          {/* SMTP Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          {/* Energy Tariff */}
          <TabsContent value="energy" className="space-y-6">
            <EnergySettings />
          </TabsContent>

          {/* Shift Management */}
          <TabsContent value="shifts" className="space-y-6">
            <ShiftManagement />
          </TabsContent>

          {/* Backup & Restore */}
          <TabsContent value="backup" className="space-y-6">
            <Backup />
          </TabsContent>

          {/* System Logs */}
          <TabsContent value="logs" className="space-y-6">
            <Logs />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
