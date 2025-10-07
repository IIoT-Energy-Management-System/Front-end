"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShiftApiService } from "@/lib/api"
import { Shift } from "@/lib/types"
import { Calendar, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function ShiftManagement() {
  const [shifts, setShifts] = useState<Shift[]>([])

  // Hàm để format thời gian từ ISO string hoặc HH:MM về HH:MM
  const formatTimeToHHMM = (timeString: string): string => {
    if (!timeString) return "00:00"
    
    // Nếu đã là HH:MM, trả về luôn
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString
    }
    
    // Nếu là ISO string, parse và format
    try {
      const date = new Date(timeString)
      const hours = date.getUTCHours().toString().padStart(2, '0')
      const minutes = date.getUTCMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } catch (error) {
      console.error('Error parsing time:', timeString, error)
      return "00:00"
    }
  }

    const fetchData = async () => {
        try {
            const response = await ShiftApiService.getShifts();
            console.log('Fetched shifts:', response);
            if (response && Array.isArray(response)) {
                // Format thời gian từ ISO string về HH:MM
                const formattedShifts = response.map(shift => ({
                    ...shift,
                    startTime: formatTimeToHHMM(shift.startTime),
                    endTime: formatTimeToHHMM(shift.endTime),
                }));
                setShifts(formattedShifts);
            }
        } catch (error) {
            console.error('Error fetching shifts:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu ca làm việc.');
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

  const addShift = () => {
    if (shifts.length < 10) {
      setShifts([...shifts, { name: "", startTime: "1970-01-01T06:00:00.000Z", endTime: "1970-01-01T06:00:00.000Z", order: shifts.length + 1 }])
    }
  }

  const removeShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index))
  }

    const validate = () => {
        // Kiểm tra tên ca không được để trống
        for (const shift of shifts) {
            if (!shift.name.trim()) {
                toast.error('Tên ca không được để trống.')
                return false
            }
        }
        // Kiểm tra thời gian bắt đầu và kết thúc hợp lệ
        for (const shift of shifts) {
            if (!shift.startTime || !shift.endTime) {
                toast.error('Thời gian bắt đầu và kết thúc không được để trống.')
                return false
            }
            if (shift.startTime >= shift.endTime) {
                toast.error('Thời gian bắt đầu phải trước thời gian kết thúc.')
                return false
            }
        }
        // Kiểm tra các ca không bị trùng thời gian
        for (let i = 0; i < shifts.length; i++) {
            const startA = shifts[i].startTime.length === 5 ? shifts[i].startTime : formatTimeToHHMM(shifts[i].startTime)
            const endA = shifts[i].endTime.length === 5 ? shifts[i].endTime : formatTimeToHHMM(shifts[i].endTime)
            for (let j = i + 1; j < shifts.length; j++) {
                const startB = shifts[j].startTime.length === 5 ? shifts[j].startTime : formatTimeToHHMM(shifts[j].startTime)
                const endB = shifts[j].endTime.length === 5 ? shifts[j].endTime : formatTimeToHHMM(shifts[j].endTime)
                // Nếu thời gian bị giao nhau
                if (
                    (startA < endB && endA > startB)
                ) {
                    toast.error('Các ca làm việc không được trùng hoặc giao nhau về thời gian.')
                    return false
                }
            }
        }
        return true
    }
    
  const handleSave = async () => {
    
    // Validate shifts
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin ca làm việc.');
      return;
    }
    
    // Convert HH:MM to ISO string for backend
    const shiftsToSave = shifts.map(shift => ({
      ...shift,
      startTime: shift.startTime.length === 5 ? `1970-01-01T${shift.startTime}:00.000Z` : shift.startTime,
      endTime: shift.endTime.length === 5 ? `1970-01-01T${shift.endTime}:00.000Z` : shift.endTime,
    }));
    
    console.log('Shifts to save:', shiftsToSave);
    try {
      await ShiftApiService.saveShifts(shiftsToSave);
      toast.success('Cấu hình ca làm việc đã được lưu thành công!')
      // Reload data sau khi lưu
      await fetchData();
    } catch (error) {
      console.error('Error saving shifts:', error)
      toast.error('Có lỗi xảy ra khi lưu cấu hình.', {
        description: (error as any).error,
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Quản Lý Lịch Ca Làm Việc
            </CardTitle>
            <CardDescription>Cấu hình ca làm việc cho phân tích và báo cáo</CardDescription>
        </div>
        
        {shifts.length < 10 && (
          <Button variant="outline" onClick={addShift}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Ca
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {shifts.map((shift, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg relative">
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
                value={formatTimeToHHMM(shift.startTime)}
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
                value={formatTimeToHHMM(shift.endTime)}
                onChange={(e) => {
                  const newShifts = [...shifts]
                  newShifts[index].endTime = e.target.value
                  setShifts(newShifts)
                }}
              />
            </div>
            <div className="absolute top-1 right-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeShift(index)}
                disabled={shifts.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button onClick={handleSave}>Lưu Cấu Hình Ca Làm Việc</Button>
      </CardContent>
    </Card>
  )
}