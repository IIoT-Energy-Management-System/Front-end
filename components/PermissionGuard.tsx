// import { usePermissions } from "@/hooks/use-permissions"
import { authService } from "@/lib/auth"
import React from "react"

interface PermissionGuardProps {
  permission: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

// interface MultiplePermissionsGuardProps {
//   permissions: string[]
//   requireAll?: boolean // true = AND, false = OR
//   fallback?: React.ReactNode
//   children: React.ReactNode
// }

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback = null,
  children
}) => {
//   const { hasPermission } = authService

  if (!authService.hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// export const MultiplePermissionsGuard: React.FC<MultiplePermissionsGuardProps> = ({
//   permissions,
//   requireAll = false,
//   fallback = null,
//   children
// }) => {
//   const { hasAllPermissions, hasAnyPermission } = usePermissions()

//   const hasAccess = requireAll
//     ? hasAllPermissions(permissions)
//     : hasAnyPermission(permissions)

//   if (!hasAccess) {
//     return <>{fallback}</>
//   }

//   return <>{children}</>
// }

// Higher-order component for class components or complex scenarios
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: string,
  fallback?: React.ReactNode
) => {
  return (props: P) => (
    <PermissionGuard permission={permission} fallback={fallback}>
      <WrappedComponent {...props} />
    </PermissionGuard>
  )
}

// export const withMultiplePermissions = <P extends object>(
//   WrappedComponent: React.ComponentType<P>,
//   permissions: string[],
//   requireAll: boolean = false,
//   fallback?: React.ReactNode
// ) => {
//   return (props: P) => (
//     <MultiplePermissionsGuard
//       permissions={permissions}
//       requireAll={requireAll}
//       fallback={fallback}
//     >
//       <WrappedComponent {...props} />
//     </MultiplePermissionsGuard>
//   )
// }
