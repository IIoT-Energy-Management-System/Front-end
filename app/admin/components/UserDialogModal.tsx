
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BuildingApiService, FactoryApiService, RoleApiService } from "@/lib/api";
import type { Building, Factory, Role, User } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import moment from "moment-timezone";
import { formatInTimeZone } from "date-fns-tz";

interface UserDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "view";
  user?: User | null;
  onSave: (userData: Partial<User>) => void;
}

export default function UserDialogModal({
  isOpen,
  onClose,
  mode,
  user,
  onSave,
}: UserDialogModalProps) {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    role: "Viewer" as User["role"],
    factoryAccess: [] as string[],
    buildingAccess: [] as string[],
    floorAccess: [] as string[],
    lineAccess: [] as string[],
    language: "en" as "en" | "vi",
    timezone: "Asia/Ho_Chi_Minh",
    isActive: true,
  });
  const [factories, setFactories] = useState<Factory[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if ((mode === "edit" || mode === "view") && user) {
      setUserData({
        username: user.username,
        email: user.email,
        role: user.role,
        factoryAccess: user.factoryAccess || [],
        buildingAccess: user.buildingAccess || [],
        floorAccess: user.floorAccess || [],
        lineAccess: user.lineAccess || [],
        language: user.language || "en",
        timezone: user.timezone || "Asia/Ho_Chi_Minh",
        isActive: user.isActive,
      });
    } else if (mode === "add") {
      setUserData({
        username: "",
        email: "",
        role: "Viewer",
        factoryAccess: [],
        buildingAccess: [],
        floorAccess: [],
        lineAccess: [],
        language: "en",
        timezone: "Asia/Ho_Chi_Minh",
        isActive: true,
      });
    }
  }, [mode, user, isOpen]);

  const fetchData = async () => {
    try {
      const [factoryList, buildingList, roleList] = await Promise.all([
        FactoryApiService.getFactories(),
        BuildingApiService.getBuildings(),
        RoleApiService.getRoles(),
      ]);
      setFactories(factoryList);
      setBuildings(buildingList);
      setRoles(roleList);
    } catch (error) {
      console.error("Failed to load factories and buildings:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        let buildingList: Building[] = [];
        if (userData.factoryAccess.length > 0) {
          const promises = userData.factoryAccess.map((factoryId) =>
            BuildingApiService.getBuildingsByFactory(factoryId)
          );
          const results = await Promise.all(promises);
          buildingList = Array.from(
            new Map(
              results.flat().map((building) => [building.id, building])
            ).values()
          );
        } else {
          buildingList = await BuildingApiService.getBuildings();
        }
        setBuildings(buildingList);
      } catch (error) {
        console.error("Failed to load buildings:", error);
      }
    };

    fetchBuildings();
  }, [userData.factoryAccess]);

  const handleSave = () => {
    onSave(userData);
    onClose();
  };

    const timezoneOptions = useMemo(() => {
        return moment.tz.names().map((tz) => ({
            value: tz,
            label: `${tz} (GMT${formatInTimeZone(new Date(), tz, "XXX")})`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, []);

  const getDialogTitle = () => {
    switch (mode) {
      case "add":
        return "Thêm Người Dùng Mới";
      case "edit":
        return "Sửa Người Dùng";
      case "view":
        return "Chi Tiết Người Dùng";
      default:
        return "Người Dùng";
    }
  };

  const getDialogDescription = () => {
    switch (mode) {
      case "add":
        return "Tạo tài khoản người dùng mới với quyền hạn cụ thể";
      case "edit":
        return "Cập nhật thông tin và quyền hạn người dùng";
      case "view":
        return "Xem chi tiết thông tin người dùng";
      default:
        return "";
    }
  };

  const isReadOnly = mode === "view";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên Đăng Nhập</Label>
              <Input
                id="username"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                readOnly={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                readOnly={isReadOnly}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Vai Trò</Label>
            <Select
              value={userData.role}
              onValueChange={(value: User["role"]) => setUserData({ ...userData, role: value })}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Factory Access */}
          <div className="space-y-2">
            <Label>Quyền Truy Cập Nhà Máy (Để trống cho tất cả)</Label>
            <div className="grid grid-cols-2 gap-2">
              {factories.map((factory) => (
                <div key={factory.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`factory-${factory.id}`}
                    checked={userData.factoryAccess.includes(factory.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setUserData((prev) => ({
                          ...prev,
                          factoryAccess: [...prev.factoryAccess, factory.id],
                        }));
                      } else {
                        setUserData((prev) => ({
                          ...prev,
                          factoryAccess: prev.factoryAccess.filter((id) => id !== factory.id),
                          buildingAccess: prev.buildingAccess.filter((buildingId) => {
                            const building = buildings.find((b) => b.id === buildingId);
                            return building ? building.factoryId !== factory.id : true;
                          }),
                        }));
                      }
                    }}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor={`factory-${factory.id}`} className="text-sm">
                    {factory.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Building Access */}
          {userData.factoryAccess.length > 0 && (
            <div className="space-y-2">
              <Label>Quyền Truy Cập Tòa Nhà (Để trống cho tất cả trong nhà máy đã chọn)</Label>
              <ScrollArea>
                <div className="grid grid-cols-2 gap-2">
                  {buildings.map((building) => (
                    <div key={building.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`building-${building.id}`}
                        checked={userData.buildingAccess.includes(building.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setUserData((prev) => ({
                              ...prev,
                              buildingAccess: [...prev.buildingAccess, building.id],
                            }));
                          } else {
                            setUserData((prev) => ({
                              ...prev,
                              buildingAccess: prev.buildingAccess.filter((id) => id !== building.id),
                            }));
                          }
                        }}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`building-${building.id}`} className="text-sm">
                        {building.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Ngôn Ngữ</Label>
              <Select
                value={userData.language}
                onValueChange={(value: "en" | "vi") => setUserData({ ...userData, language: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">Tiếng Anh</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Múi Giờ</Label>
              <Select
                value={userData.timezone}
                onValueChange={(value) => setUserData({ ...userData, timezone: value })}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn múi giờ..." />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode !== "add" && (
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={userData.isActive}
                onCheckedChange={(checked) => setUserData({ ...userData, isActive: checked })}
                disabled={isReadOnly}
              />
              <Label htmlFor="isActive">Người Dùng Hoạt Động</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {mode === "view" ? "Đóng" : "Hủy"}
          </Button>
          {mode !== "view" && (
            <Button
              onClick={handleSave}
              disabled={!userData.username || !userData.email}
            >
              {mode === "add" ? "Thêm Người Dùng" : "Lưu Thay Đổi"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}