"use client"

let notificationsSeen = false

import { Badge } from "@/components/ui/badge"
import { BASE_API_URL, useAlertApi } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import type { Alert } from "@/lib/types"
import { AlertTriangle, Bell, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { io } from "socket.io-client"
import AlertDetailModal from "./AlertDetailModal"
type AlertItem = {
  id: string
  deviceId?: string
  type?: string
  severity?: string
  message?: string
  timestamp?: string
  acknowledged?: boolean
  resolved?: boolean
}

export default function NotificationPopup() {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasNotifications, setHasNotifications] = useState(() => !notificationsSeen)
  const ref = useRef<HTMLDivElement | null>(null)

  const { getAlertsActive } = useAlertApi()
  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const response = await getAlertsActive()
      if (!response) {
        setAlerts([])
      } else if (Array.isArray(response)) {
        setAlerts(response)
      } else if ((response as any).data) {
        setAlerts((response as any).data)
      } else {
        setAlerts([])
      }
    } catch (e) {
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  const toggle = async () => {
    const next = !show
    setShow(next)
    if (next) await fetchAlerts()
  }

  useEffect(() => {
    fetchAlerts();
    
    const socket = io(BASE_API_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("active-alerts", (message) => {
      if (message.type === 'delta') {
        const { added, removed } = message.data;
        setAlerts((prevAlerts) => {
          // Add new alerts
          let newAlerts = [...prevAlerts, ...added];
          // Remove alerts whose id is in the removed array
          const removedIds = removed.map((r: AlertItem) => r.id);
          newAlerts = newAlerts.filter(alert => !removedIds.includes(alert.id));
          
          // Only show notification animation if there are new alerts
          if (added.length > 0) {
            notificationsSeen = false;
            setHasNotifications(true);
          }
          return newAlerts;
        });
      } else {
        setAlerts(message.data || []);
      }
    });

    const onDoc = (e: MouseEvent) => {
      if (!show) return
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    };

    document.addEventListener('mousedown', onDoc);
    return () => {
      socket.disconnect();
      document.removeEventListener('mousedown', onDoc);
    };
  }, [show]);

  const handleClick = (a: AlertItem) => {
    setSelectedAlert(a)
    setShow(false)
  }

  const getSeverityColor = (severity: Alert["severity"]) => {
    switch (severity) {
      case "Critical":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0"
      case "Warning":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0"
      case "Info":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0"
        case "High":
        return "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0"
    }
  }

  const getSeverityIcon = (severity: Alert["severity"]) => {
    switch (severity) {
      case "Critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "Warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "Info":
        return <Bell className="h-4 w-4 text-blue-600" />
      case "High":
        return <AlertTriangle className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }
  const unread = alerts.filter(a => !a.acknowledged && !a.resolved).length

  return (
    <div className="relative" ref={ref}>
  <button aria-label="Open notifications" className="p-2 hover:bg-blue-100 hover:text-blue-800 rounded-lg border-gray-200 border" onClick={async () => { await toggle(); notificationsSeen = true; setHasNotifications(false); }}>
        <Bell className="h-6 w-6" />
        <div className={`absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-xs z-10 ${unread > 0 ? 'block' : 'hidden'}`}>{unread || 0}</div>
        {unread > 0 && (
          <div className={`absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-xs z-10`}>
            {unread}{unread === 99 ? '+' : ''}
          </div>
        )}
        {unread > 0 && hasNotifications && (
          <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-7 w-7 animate-ping z-9"></div>
        )}
        </button>

      {show && (
        <div className="absolute -right-40 sm:left-0 sm:-right-96 mt-2 w-90 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="font-medium">{t("notification.popupTitle")}</div>
            <button className="text-sm text-gray-500" onClick={() => fetchAlerts()}><RotateCcw/></button>
          </div>
          <div className="max-h-64 overflow-auto">
            {loading && <div className="p-3 text-sm text-gray-500">{t("notification.loading")}</div>}
            {!loading && alerts.length === 0 && <div className="p-3 text-sm text-gray-500">{t("notification.noNotifications")}</div>}
            {!loading && alerts.map((a) => (
              <button key={a.id} onClick={() => handleClick(a)} className="w-full text-left p-3 border-b hover:bg-gray-50 flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.type}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.message}</div>
                  <div className="text-xs text-gray-400 mt-1">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  {getSeverityIcon(a.severity as Alert["severity"])}
                  <Badge className={getSeverityColor(a.severity as Alert["severity"])}>{a.severity}</Badge>
                </div>
              </button>
            ))}
          </div>
            <Link href="/alerts" className="text-center text-sm border-t-2 w-full" onClick={() => { setShow(false); setSelectedAlert(null); }}>
              <p className="text-blue-600 hover:bg-blue-200 p-2">{t("notification.viewAllAlerts")}</p>
            </Link>
        </div>
      )}
      {/* Alert detail modal */}
      <AlertDetailModal 
        alert={selectedAlert} 
        onClose={() => {
          setShow(false)
          setSelectedAlert(null)
        }} 
      />
    </div>
  )
}
