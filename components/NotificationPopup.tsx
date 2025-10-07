"use client"

let notificationsSeen = false

import { io } from "socket.io-client"
import { Badge } from "@/components/ui/badge"
import { useAlertApi } from "@/lib/api"
import type { Alert } from "@/lib/types"
import { AlertTriangle, Bell, RotateCcw, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
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
    
    const socket = io("http://localhost:5000", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("active-alerts", (message) => {
      if (message.type === 'delta') {
        const { added } = message.data;
        setAlerts((prevAlerts) => {
          let newAlerts = [...prevAlerts, ...added];
          notificationsSeen = false; setHasNotifications(true);
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
      default:
        return <Bell className="h-4 w-4" />
    }
  }
  const unread = alerts.filter(a => !a.acknowledged && !a.resolved).length

  return (
    <div className="relative" ref={ref}>
  <button aria-label="Open notifications" className="p-2 hover:bg-blue-100 hover:text-blue-800 rounded-lg border-gray-200 border" onClick={async () => { await toggle(); notificationsSeen = true; setHasNotifications(false); }}>
        <Bell className="h-6 w-6" />
        <div className={`absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs z-10 ${unread > 0 ? 'block' : 'hidden'}`}>{unread || 0}</div>
        {unread > 0 && (
          <div className={`absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs z-10`}>
            {unread}
          </div>
        )}
        {unread > 0 && hasNotifications && (
          <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full h-6 w-6 animate-ping z-9"></div>
        )}
        </button>

      {show && (
        <div className="absolute left-0 mt-2 w-90 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="font-medium">Notifications</div>
            <button className="text-sm text-gray-500" onClick={() => fetchAlerts()}><RotateCcw/></button>
          </div>
          <div className="max-h-64 overflow-auto">
            {loading && <div className="p-3 text-sm text-gray-500">Loading...</div>}
            {!loading && alerts.length === 0 && <div className="p-3 text-sm text-gray-500">No notifications</div>}
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
              <p className="text-blue-600 hover:bg-blue-200 p-2">View all alerts</p>
            </Link>
        </div>
      )}
      {/* Alert detail modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setSelectedAlert(null)} />
          <div className="relative bg-white rounded p-6 w-11/12 max-w-lg shadow-lg z-50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedAlert.type}</h3>
                <div className="text-sm text-gray-500">{new Date(selectedAlert.timestamp).toLocaleString()}</div>
              </div>
              <button className="text-gray-500 hover:bg-gray-100 p-1 rounded" onClick={() => setSelectedAlert(null)}><X /></button>
            </div>
            <div className="mt-4 text-sm text-gray-700">
              <p><strong>Severity:</strong> <Badge className={getSeverityColor(selectedAlert.severity as Alert["severity"])}>{selectedAlert.severity}</Badge></p>
              <p className="mt-2"><strong>Message:</strong> {selectedAlert.message}</p>
              <p className="mt-2"><strong>Device:</strong> {selectedAlert.deviceName}</p>
            </div>
            <div className="mt-4 text-right">
              <Link href={`/alerts?alertId=${selectedAlert?.id}`} className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => { setShow(false); setSelectedAlert(null); }} >Đi đến xác nhận</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
