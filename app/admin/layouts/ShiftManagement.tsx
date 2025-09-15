"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"
import { useState } from "react"

export default function ShiftManagement() {
  const [shifts, setShifts] = useState([
    { name: "Day Shift", startTime: "06:00", endTime: "14:00" },
    { name: "Evening Shift", startTime: "14:00", endTime: "22:00" },
    { name: "Night Shift", startTime: "22:00", endTime: "06:00" },
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Quản Lý Lịch Ca Làm Việc
        </CardTitle>
        <CardDescription>Cấu hình ca làm việc cho phân tích và báo cáo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {shifts.map((shift, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label>Tên Ca</Label>
              <Input
                value={shift.name}
                onChange={(e) => {
                  const newShifts = [...shifts]
                  newShifts[index].name = e.target.value
                  setShifts(newShifts)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Thời Gian Bắt Đầu</Label>
              <Input
                type="time"
                value={shift.startTime}
                onChange={(e) => {
                  const newShifts = [...shifts]
                  newShifts[index].startTime = e.target.value
                  setShifts(newShifts)
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Thời Gian Kết Thúc</Label>
              <Input
                type="time"
                value={shift.endTime}
                onChange={(e) => {
                  const newShifts = [...shifts]
                  newShifts[index].endTime = e.target.value
                  setShifts(newShifts)
                }}
              />
            </div>
          </div>
        ))}
        <Button variant="outline">Lưu Cấu Hình Ca Làm Việc</Button>
      </CardContent>
    </Card>
  )
}