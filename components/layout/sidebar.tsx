"use client"

import NotificationPopup from "@/components/NotificationPopup"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"
import { useAppStore } from "@/lib/store"
import {
    AlertTriangle,
    BarChart3,
    Cpu,
    FileText,
    Globe,
    LayoutDashboard,
    LogOut,
    Map,
    Menu,
    Settings,
    X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

export const navigation = [
  { name: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, permission: null }, // Dashboard accessible to all logged in users
  { name: "nav.devices", href: "/devices", icon: Cpu, permission: "device.view" },
  { name: "nav.layouts", href: "/layouts", icon: Map, permission: "layout.view" },
  { name: "nav.analytics", href: "/analytics", icon: BarChart3, permission: "analytic.view" },
  { name: "nav.reports", href: "/reports", icon: FileText, permission: "report.view" },
  { name: "nav.alerts", href: "/alerts", icon: AlertTriangle, permission: "alert.view" },
  { name: "nav.admin", href: "/admin", icon: Settings, permission: "settings.view" }, // Admin requires settings.view permission
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout, language, setLanguage } = useAppStore()
  const { t } = useTranslation()

  // Filter navigation based on user permissions
  const filteredNavigation = useMemo(() => {
    if (!user) return []
    
    // Admin role has access to everything
    if (user.role === "Admin") return navigation
    console.log("user permission: ", user.permissions);
    // Filter navigation items based on permissions
    return navigation.filter(item => {
      // If no permission required, allow access
      if (!item.permission) return true
      console.log("list permission: ", item.permission);
      // Check if user has the required permission
      return user.permissions?.includes(item.permission) || false
    })
  }, [user])

  const handleLogout = () => {
    logout()
  }

  const handleOpen = () => {
    setIsOpen(!isOpen);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <div style={{ display: "block", margin: "auto", width: "235px" }} className="flex justify-center mb-4 h-30 w-40 overflow-hidden rounded">
            <img
              src="https://new-ocean.com.vn/wp-content/uploads/2021/12/z3070143378207_42659dfb864677b5188fb31a5e889811.jpg.webp"
              alt="IIoT Logo"
              className="h-full w-full object-cover object-center" 
              style={{
                    width: "500px",
                    height: "100px",
                    objectFit: "cover",
                    objectPosition: "center"
                }}
            />
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b">
        <div className="text-sm font-medium">{user?.username}</div>
        <div className="text-xs text-muted-foreground">{user?.role}</div>
        {/* <div><PermissionGuard permission="user.view"><Button variant="ghost" size="sm" onClick={() => handleEdit(user.id, user.name, "người dùng")}>Edit</Button></PermissionGuard></div> */}
        {/* <div className="text-xs text-muted-foreground">{user?.permissions?.join("| |")}</div> */}
      </div>

      {/* Language Selector */}
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2 w-full">
          <Globe className="h-4 w-4" />
          <Select value={language} onValueChange={(value: "en" | "vi") => setLanguage(value)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NotificationPopup />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              <span>{t(item.name as Parameters<typeof t>[0])}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="h-5 w-5 mr-3" />
          {t("nav.logout")}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <Button size="icon" className="lg:hidden fixed top-4 left-4 z-50" onClick={handleOpen}>
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r z-50">{sidebarContent}</div>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleOpen} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r z-50">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}
