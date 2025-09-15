"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap } from "lucide-react"
import { useState } from "react"

export default function EnergySettings() {
  const [energyTariff, setEnergyTariff] = useState({
    type: "flat" as "flat" | "timeOfUse",
    flatRate: 0.12,
    timeOfUse: [
      { startTime: "06:00", endTime: "18:00", rate: 0.15 },
      { startTime: "18:00", endTime: "06:00", rate: 0.08 },
    ],
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Cấu Hình Biểu Giá Điện
        </CardTitle>
        <CardDescription>Thiết lập giá điện để tính toán chi phí</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Loại Biểu Giá</Label>
          <Select
            value={energyTariff.type}
            onValueChange={(value: "flat" | "timeOfUse") => setEnergyTariff({ ...energyTariff, type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Giá Cố Định</SelectItem>
              <SelectItem value="timeOfUse">Theo Thời Gian Sử Dụng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {energyTariff.type === "flat" ? (
          <div className="space-y-2">
            <Label htmlFor="flatRate">Giá ($/kWh)</Label>
            <Input
              id="flatRate"
              type="number"
              step="0.01"
              value={energyTariff.flatRate}
              onChange={(e) =>
                setEnergyTariff({ ...energyTariff, flatRate: Number.parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Label>Giá Theo Thời Gian Sử Dụng</Label>
            {energyTariff.timeOfUse.map((period, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Thời Gian Bắt Đầu</Label>
                  <Input
                    type="time"
                    value={period.startTime}
                    onChange={(e) => {
                      const newTimeOfUse = [...energyTariff.timeOfUse]
                      newTimeOfUse[index].startTime = e.target.value
                      setEnergyTariff({ ...energyTariff, timeOfUse: newTimeOfUse })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời Gian Kết Thúc</Label>
                  <Input
                    type="time"
                    value={period.endTime}
                    onChange={(e) => {
                      const newTimeOfUse = [...energyTariff.timeOfUse]
                      newTimeOfUse[index].endTime = e.target.value
                      setEnergyTariff({ ...energyTariff, timeOfUse: newTimeOfUse })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Giá ($/kWh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={period.rate}
                    onChange={(e) => {
                      const newTimeOfUse = [...energyTariff.timeOfUse]
                      newTimeOfUse[index].rate = Number.parseFloat(e.target.value) || 0
                      setEnergyTariff({ ...energyTariff, timeOfUse: newTimeOfUse })
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline">Lưu Cài Đặt Biểu Giá</Button>
      </CardContent>
    </Card>
  )
}