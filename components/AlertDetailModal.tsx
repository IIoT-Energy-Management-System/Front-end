"use client"

import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/i18n"
import type { Alert } from "@/lib/types"
import { X } from "lucide-react"
import Link from "next/link"

type AlertItem = {
  id: string
  deviceId?: string
  deviceName?: string
  type?: string
  severity?: string
  message?: string
  timestamp?: string
  acknowledged?: boolean
  resolved?: boolean
}

interface AlertDetailModalProps {
  alert: AlertItem | null
  onClose: () => void
}

export default function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const { t } = useTranslation()

  if (!alert) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-lg shadow-lg z-50">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{alert.type || "Cảnh báo"}</h3>
            <div className="text-sm text-gray-500">
              {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ''}
            </div>
          </div>
          <button 
            className="text-gray-500 hover:bg-gray-100 p-1 rounded" 
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-700">
          <p>
            <strong>{t("notification.severity")}:</strong>{" "}
            <Badge className={getSeverityColor(alert.severity as Alert["severity"])}>
              {alert.severity}
            </Badge>
          </p>
          <p className="mt-2">
            <strong>{t("notification.message")}:</strong> {alert.message}
          </p>
          <p className="mt-2">
            <strong>{t("notification.device")}:</strong> {alert.deviceName}
          </p>
        </div>
        <div className="mt-4 text-right">
          <Link 
            href={`/alerts?alertId=${alert.id}`} 
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={onClose}
          >
            {t("notification.goToAcknowledge")}
          </Link>
        </div>
      </div>
    </div>
  )
}
