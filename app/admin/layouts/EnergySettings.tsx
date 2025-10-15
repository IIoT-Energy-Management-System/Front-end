"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { EnergySettingsApiService } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import { Zap, Trash2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { authService } from "@/lib/auth"

interface ValidationErrors {
  flatRate?: string
  timeOfUseData?: string[]
  general?: string
}

export default function EnergySettings() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [energyTariff, setEnergyTariff] = useState({
    type: "flat" as "flat" | "timeOfUse",
    flatRate: 0.12,
    timeOfUseData: [
      { startTime: "06:00", endTime: "18:00", rate: 0.15 },
      { startTime: "18:00", endTime: "06:00", rate: 0.08 },
    ],
  })

  // Validation functions
  const validateFlatRate = (rate: number): string | undefined => {
    if (!rate || rate <= 0) {
      return t("energy.flatRateInvalid")
    }
    return undefined
  }

  const validateTimeOfUse = (periods: typeof energyTariff.timeOfUseData): string[] => {
    const periodErrors: string[] = []

    if (!periods || periods.length === 0) {
      periodErrors.push(t("energy.timeOfUseRequired"))
      return periodErrors
    }

    periods.forEach((period, index) => {
      if (!period.startTime || !period.endTime || !period.rate) {
        periodErrors.push(`${t("energy.timeOfUseInvalid")} (${index + 1})`)
        return
      }

      if (period.rate <= 0) {
        periodErrors.push(`${t("energy.priceInvalid")} (${index + 1})`)
      }

      // Check time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(period.startTime) || !timeRegex.test(period.endTime)) {
        periodErrors.push(`${t("energy.timeFormat")} (${index + 1})`)
      }
    })

    // Check for overlapping periods
    for (let i = 0; i < periods.length; i++) {
      for (let j = i + 1; j < periods.length; j++) {
        if (doPeriodsOverlap(periods[i], periods[j])) {
          periodErrors.push(t("energy.timeOverlap"))
          break
        }
      }
      if (periodErrors.includes(t("energy.timeOverlap"))) break
    }

    return periodErrors
  }

  const doPeriodsOverlap = (period1: any, period2: any): boolean => {
    const start1 = timeToMinutes(period1.startTime)
    const end1 = timeToMinutes(period1.endTime)
    const start2 = timeToMinutes(period2.startTime)
    const end2 = timeToMinutes(period2.endTime)

    // Handle overnight periods (end time < start time)
    const adjustedEnd1 = end1 < start1 ? end1 + 1440 : end1
    const adjustedEnd2 = end2 < start2 ? end2 + 1440 : end2

    return start1 < adjustedEnd2 && start2 < adjustedEnd1
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const handleAddNewPeriod = () => {
    if (energyTariff.timeOfUseData.length < 5) {
        setEnergyTariff({
            ...energyTariff,
            timeOfUseData: [...energyTariff.timeOfUseData, { startTime: "00:00", endTime: "00:00", rate: 0 }],
        })
    }
  }

  const removeEnergyPeriod = (index: number) => {
    if (energyTariff.timeOfUseData.length > 1) {
        const newTimeOfUse = [...energyTariff.timeOfUseData]
        newTimeOfUse.splice(index, 1)
        setEnergyTariff({
            ...energyTariff,
            timeOfUseData: newTimeOfUse,
        })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (energyTariff.type === 'flat') {
      const flatRateError = validateFlatRate(energyTariff.flatRate)
      if (flatRateError) {
        newErrors.flatRate = flatRateError
      }
    } else {
      const timeOfUseErrors = validateTimeOfUse(energyTariff.timeOfUseData)
      if (timeOfUseErrors.length > 0) {
        newErrors.timeOfUseData = timeOfUseErrors
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Load energy settings on component mount
  useEffect(() => {
    loadEnergySettings()
  }, [])

  const loadEnergySettings = async () => {
    try {
      setLoading(true)
      const settings = await EnergySettingsApiService.getEnergySettings()
      setEnergyTariff({
        type: settings.type,
        flatRate: settings.flatRate || 0.12,
        timeOfUseData: settings.timeOfUseData || [
          { startTime: "06:00", endTime: "18:00", rate: 0.15 },
          { startTime: "18:00", endTime: "06:00", rate: 0.08 },
        ],
      })
    } catch (error) {
      console.error('Failed to load energy settings:', error)
      toast.error(t("common.error"),{ description: t("energy.loadError") })
      // Load default settings if no settings exist
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setSaving(true)
      await EnergySettingsApiService.updateEnergySettings({
        type: energyTariff.type,
        flatRate: energyTariff.type === 'flat' ? energyTariff.flatRate : undefined,
        timeOfUseData: energyTariff.type === 'timeOfUse' ? energyTariff.timeOfUseData : undefined,
      })

      toast.success(t("energy.saveSuccess"))
    } catch (error) {
      console.error('Failed to save energy settings:', error)
      toast.error(t("common.error"),{ description: t("energy.saveError") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          {t("energy.title")}
        </CardTitle>
        <CardDescription>{t("energy.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading energy settings...</div>
          </div>
        ) : (
          <>
            {errors.general && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("energy.tariffType")}</Label>
              <Select
                value={energyTariff.type}
                onValueChange={(value: "flat" | "timeOfUse") => {
                  setEnergyTariff({ ...energyTariff, type: value })
                  setErrors({}) // Clear errors when switching types
                }}
                disabled={saving || !authService.hasPermission("settings.edit")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">{t("energy.flatRate")}</SelectItem>
                  <SelectItem value="timeOfUse">{t("energy.timeOfUse")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {energyTariff.type === "flat" ? (
              <div className="space-y-2">
                <Label htmlFor="flatRate">{t("energy.price")}</Label>
                <Input
                  id="flatRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={energyTariff.flatRate}
                  onChange={(e) => {
                    const value = Number.parseFloat(e.target.value) || 0
                    setEnergyTariff({ ...energyTariff, flatRate: value })
                    // Clear error if valid
                    if (value > 0) {
                      setErrors(prev => ({ ...prev, flatRate: undefined }))
                    }
                  }}
                  disabled={saving || !authService.hasPermission("settings.edit")}
                  className={errors.flatRate ? "border-red-500" : ""}
                />
                {errors.flatRate && (
                  <p className="text-sm text-red-600">{errors.flatRate}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>{t("energy.timeOfUsePricing")}</Label>
                    <Button
                        variant="outline"
                        onClick={handleAddNewPeriod}
                        disabled={saving || energyTariff.timeOfUseData.length >= 5 || !authService.hasPermission("settings.edit")}>
                    {/* {t("energy.addPeriod")} */}
                    <Plus className="h-4 w-4 mr-2" />
                        {t("common.add")}
                    </Button>
                </div>
                {energyTariff.timeOfUseData.map((period, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg relative">
                    <div className="flex gap-2 md:col-span-2">
                        <div className="space-y-2 flex-1">
                        <Label>{t("energy.startTime")}</Label>
                        <Input
                            type="time"
                            value={period.startTime}
                            onChange={(e) => {
                            const newTimeOfUse = [...energyTariff.timeOfUseData]
                            newTimeOfUse[index].startTime = e.target.value
                            setEnergyTariff({ ...energyTariff, timeOfUseData: newTimeOfUse })
                            setErrors(prev => ({ ...prev, timeOfUseData: undefined })) // Clear time-of-use errors
                            }}
                            disabled={saving || !authService.hasPermission("settings.edit")}
                        />
                        </div>
                        <div className="space-y-2 flex-1">
                        <Label>{t("energy.endTime")}</Label>
                        <Input
                            type="time"
                            value={period.endTime}
                            onChange={(e) => {
                            const newTimeOfUse = [...energyTariff.timeOfUseData]
                            newTimeOfUse[index].endTime = e.target.value
                            setEnergyTariff({ ...energyTariff, timeOfUseData: newTimeOfUse })
                            setErrors(prev => ({ ...prev, timeOfUseData: undefined })) // Clear time-of-use errors
                            }}
                            disabled={saving || !authService.hasPermission("settings.edit")}
                        />
                        </div>
                    </div>
                        <div className="space-y-2 sm:col-span-1">
                        <Label>{t("energy.price")}</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={period.rate}
                            onChange={(e) => {
                            const newTimeOfUse = [...energyTariff.timeOfUseData]
                            newTimeOfUse[index].rate = Number.parseFloat(e.target.value) || 0
                            setEnergyTariff({ ...energyTariff, timeOfUseData: newTimeOfUse })
                            setErrors(prev => ({ ...prev, timeOfUseData: undefined })) // Clear time-of-use errors
                            }}
                            disabled={saving || !authService.hasPermission("settings.edit")}
                        />
                        </div>
                    <div className="absolute top-1 right-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEnergyPeriod(index)}
                            disabled={energyTariff.timeOfUseData.length <= 1 || saving || !authService.hasPermission("settings.edit")}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </div>
                ))}
                {errors.timeOfUseData && errors.timeOfUseData.length > 0 && (
                  <div className="space-y-1">
                    {errors.timeOfUseData.map((error, index) => (
                      <p key={index} className="text-sm text-red-600">{error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" onClick={handleSave} disabled={saving || !authService.hasPermission("settings.edit")}>
              {saving ? "Saving..." : t("energy.saveTariff")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}