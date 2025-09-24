import { useAppStore } from "@/lib/store"

export type Permission =
    | "alert.acknowledge"
    | "alert.resolve"
    | "alert.view"
    | "analytic.export"
    | "analytic.view"
    | "device.create"
    | "device.delete"
    | "device.edit"
    | "device.view"
    | "layout.create"
    | "layout.edit"
    | "layout.view"
    | "report.generate"
    | "report.view"
    | "role.create"
    | "role.delete"
    | "role.edit"
    | "role.view"
    | "settings.edit"
    | "settings.view"
    | "user.create"
    | "user.delete"
    | "user.edit"
    | "user.view"
    // | "factory.view"
    // | "building.view"
    // | "floor.view"
    // | "line.view"
    // | "dashboard.view"

export const usePermissions = () => {
  const { user } = useAppStore()

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.permissions) return false
    return user.permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user || !user.permissions) return false
    return permissions.some(permission => user.permissions!.includes(permission))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user || !user.permissions) return false
    return permissions.every(permission => user.permissions!.includes(permission))
  }

  const getUserPermissions = (): string[] => {
    return user?.permissions || []
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    user
  }
}
