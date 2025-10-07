"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import TimezoneCombobox from "@/components/ui/combobox";
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
import { BuildingApiService, FactoryApiService, FloorApiService, LineApiService, RoleApiService, UserApiService } from "@/lib/api";
import type { Building, Factory, Floor, Line, Role, User } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from 'sonner';

interface UserDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "view";
  user?: User | null;
  onSave: (userData: User) => void;
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
    roleId: "",
    factoryAccess: [] as string[],
    buildingAccess: [] as string[],
    floorAccess: [] as string[],
    lineAccess: [] as string[],
    language: "en" as "en" | "vi",
    timezone: "",
    isActive: true,
  });
  const [factories, setFactories] = useState<Factory[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string;}>({});
  
  useEffect(() => {
    if ((mode === "edit" || mode === "view") && user) {
      setUserData({
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        factoryAccess: user.factoryAccess || [],
        buildingAccess: user.buildingAccess || [],
        floorAccess: user.floorAccess || [],
        lineAccess: user.lineAccess || [],
        language: user.language || "en",
        timezone: user.timezone || "Asia/Ho_Chi_Minh",
        isActive: user.isActive,
      });
      console.log("Loaded user data:", user)
    } else if (mode === "add") {
      setUserData({
        username: "",
        email: "",
        roleId: "",
        factoryAccess: [],
        buildingAccess: [],
        floorAccess: [],
        lineAccess: [],
        language: "en",
        timezone: "Asia/Ho_Chi_Minh",
        isActive: false,
      });
    }
  }, [mode, user, isOpen]);

  const fetchData = async () => {
    try {
      const [factoryList, roleList] = await Promise.all([
        FactoryApiService.getFactories(),
        RoleApiService.getRoles(),
      ]);
      setFactories(factoryList);
      setRoles(roleList);
    } catch (error) {
      console.error("Failed to load factories and roles:", error);
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
            // Lấy buildings thuộc factories đã chọn
            const promises = userData.factoryAccess.map((factoryId) =>
            BuildingApiService.getBuildingsByFactory(factoryId)
            );
            const results = await Promise.all(promises);
            buildingList = Array.from(
            new Map(
                results.flat().map((building) => [building.id, building])
            ).values()
            );
            // Chỉ cập nhật buildingAccess nếu chưa có building nào được chọn
            setUserData((prev) => ({
            ...prev,
            buildingAccess: prev.buildingAccess.filter((id) =>
                    buildingList.some((b) => b.id === id)
                    ), // Giữ lại các building hợp lệ
            }));
        }
        //   console.log("Fetched buildings:", buildingList);
        //   console.log("Current buildingAccess:", userData.buildingAccess);
        //   console.log("Current factoryAccess:", userData.factoryAccess);
        setBuildings(buildingList);
        } catch (error) {
        console.error("Failed to load buildings:", error);
        }
    };

    fetchBuildings();
}, [userData.factoryAccess]);

//   useEffect(() => {
//     const fetchFloorsAndLines = async () => {
//       if (userData.buildingAccess.length > 0) {
//         try {
//           // Load floors thuộc buildings đã chọn
//           const floorPromises = userData.buildingAccess.map(buildingId => 
//             FloorApiService.getFloorsByBuilding(buildingId)
//           );
//           const floorResults = await Promise.all(floorPromises);
//           const allFloors = Array.from(
//             new Map(floorResults.flat().map(floor => [floor.id, floor])).values()
//           );
//           setFloors(allFloors);

//           // Load lines thuộc floors đã chọn
//           const linePromises = userData.floorAccess.map(floorId =>
//             LineApiService.getLinesByFloor(floorId)
//           );
//           const lineResults = await Promise.all(linePromises);
//           const allLines = Array.from(
//             new Map(lineResults.flat().map(line => [line.id, line])).values()
//           );
//           setLines(allLines);

//           // Auto-populate nếu không phải advanced mode
//           if (!isAdvancedMode) {
//             setUserData(prev => ({
//               ...prev,
//               floorAccess: allFloors.map(f => f.id),
//               lineAccess: allLines.map(l => l.id)
//             }));
//           }
//         } catch (error) {
//           console.error("Failed to load floors and lines:", error);
//         }
//       } else {
//         setFloors([]);
//         setLines([]);
//         setUserData(prev => ({
//           ...prev,
//           floorAccess: [],
//           lineAccess: []
//         }));
//       }
//     };

//     fetchFloorsAndLines();
//   }, [userData.buildingAccess, isAdvancedMode]);

    useEffect(() => {
        const fetchFLoors = async () => {
            if (userData.buildingAccess.length > 0) {
                try {
                    // Load floors thuộc buildings đã chọn
                    const floorPromises = userData.buildingAccess.map(buildingId =>
                        FloorApiService.getFloorsByBuilding(buildingId)
                    );
                    const floorResults = await Promise.all(floorPromises);
                    const allFloors = Array.from(
                        new Map(floorResults.flat().map(floor => [floor.id, floor])).values()
                    );
                    setFloors(allFloors);

                    // if(!isAdvancedMode) {
                    //     setUserData(prev => ({
                    //         ...prev,
                    //         floorAccess: allFloors.map(f => f.id),
                    //     }));
                    // } else {
                        setUserData(prev => ({
                            ...prev,
                            floorAccess: prev.floorAccess.filter((id) =>
                                allFloors.some((b) => b.id === id)
                            ), // Giữ lại các floor hợp lệ
                        }));
                    //     setLines([]);
                    // }
                } catch (error) {
                    console.error("Failed to load floors:", error);
                }
            } else {
                setFloors([]);
                setUserData(prev => ({
                    ...prev,
                    floorAccess: [],
                    lineAccess: [],
                }));
                setLines([]);
            }
        }
        fetchFLoors();
    }, [userData.buildingAccess, isAdvancedMode]);

    useEffect(() => {
        setIsAdvancedMode(false)
    }, [userData.factoryAccess, userData.buildingAccess]);

    // useEffect để tải lines, chỉ chạy khi có floor được chọn và isAdvancedMode = true
    useEffect(() => {
        const fetchLines = async () => {
        if (userData.floorAccess.length > 0) {
            try {
                const linePromises = userData.floorAccess.map(floorId =>
                    LineApiService.getLinesByFloor(floorId)
                );
                const lineResults = await Promise.all(linePromises);
                const allLines = Array.from(
                    new Map(lineResults.flat().map(line => [line.id, line])).values()
                );
                setLines(allLines);

                setUserData(prev => ({
                    ...prev,
                    lineAccess: prev.lineAccess.filter((id) =>
                                allLines.some((b) => b.id === id)
                            ), // Giữ lại các line hợp lệ
                }));
            } catch (error) {
            console.error("Failed to load lines:", error);
            }
        } else {
            setLines([]);
            setUserData(prev => ({
                ...prev,
                lineAccess: [],
            }));
        }
        };

        fetchLines();
    }, [userData.floorAccess, isAdvancedMode]);

    const validate = () => {
        let valid = true;
        const newErrors: { username?: string; email?: string; factoryAccess?: string; buildingAccess?: string; } = {};
        if (!userData.username) {
            newErrors.username = 'Tên người dùng là bắt buộc.';
            valid = false;
        }
        if (!userData.email) {
            newErrors.email = 'Email là bắt buộc.';
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
            newErrors.email = 'Email không hợp lệ.';
            valid = false;
        }

        // if(userData.factoryAccess.length === 0) {
        //     newErrors.factoryAccess = 'Phải có ít nhất một nhà máy được chọn.';
        //     valid = false;
        // }
        // if(userData.buildingAccess.length === 0) {
        //     newErrors.buildingAccess = 'Phải có ít nhất một tòa nhà được chọn.';
        //     valid = false;
        // }
        setErrors(newErrors);
        return valid;
    }
    const handleSave = async () => {
        // Reset lỗi trước khi validate
        setErrors({});
        setIsSaving(true);

        if(validate()) {  // ✅ Đúng: Nếu validate pass (true), thì mới tạo user
            try {
                let savedUser: User;
                if (mode === 'add') {
                    // console.log("userData",userData)
                    savedUser = await UserApiService.createUser(userData);
                } else if (mode === 'edit') {
                    if (!user?.id) throw new Error('User ID is required for update');
                    console.log("user",userData)
                    const updatedUsers = await UserApiService.updateUser(user.id, userData);
                    savedUser = updatedUsers[0];
                } else {
                    return; // Không xử lý mode 'view'
                }
                // Toast thành công và đóng dialog
                toast.success('Lưu thành công!', {
                description: `Người dùng ${userData.username} đã được ${mode === 'add' ? 'tạo' : 'cập nhật'}.`,
                });
                onSave(savedUser); // Gọi onSave để parent refresh
                onClose(); // Đóng dialog
            } catch (error: any) {
                // Xử lý lỗi từ API
                const errorMessage = 'Lưu thất bại';
                const errorDetails = error?.error || error?.message || 'Vui lòng thử lại.';

                // Toast lỗi nếu API thất bại
                setErrors(errorDetails);
                toast.error(errorMessage, {
                    description: errorDetails,
                    duration: 10000,
                });
                console.error('Lưu người dùng thất bại:', error);
            } finally {
                setIsSaving(false);
            }
        } else {
            console.log('Error:', errors);
            toast.error("Lỗi thêm thông tin người dùng", {
                duration: 10000,
            });
            setIsSaving(false);  // ✅ Thêm: Reset saving state khi validate fail
        }
    };

    // Xóa error khi user sửa input (chỉ xóa error của field đang sửa)
    useEffect(() => {
        if (errors.username) {
            setErrors((prev) => ({ ...prev, username: undefined }));
        }
    }, [userData.username]);

    useEffect(() => {
        if (errors.email) {
            setErrors((prev) => ({ ...prev, email: undefined }));
        }
    }, [userData.email]);

    // useEffect(() => {
    //     if (errors.factoryAccess) {
    //         setErrors((prev) => ({ ...prev, factoryAccess: undefined }));
    //     }
    // }, [userData.factoryAccess]);

    // useEffect(() => {
    //     if (errors.buildingAccess) {
    //         setErrors((prev) => ({ ...prev, buildingAccess: undefined }));
    //     }
    // }, [userData.buildingAccess]);


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
  const isAdminReadOnly = mode === "view" || mode === "edit";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên Người Dùng</Label>
              <Input
                id="username"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                readOnly={isAdminReadOnly}
                className={errors.username ? 'border-red-500' : ''}
              />
                {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                readOnly={isAdminReadOnly}
                className={errors.email ? 'border-red-500' : ''}
                // style={{ color: errors.email ? 'red' : 'gray' }}
              />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Vai Trò</Label>
            <Select
              value={userData.roleId}
              onValueChange={(value) => setUserData({ ...userData, roleId: value })}
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Factory Access */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Quyền Truy Cập Nhà Máy (Để trống cho tất cả)</Label>
                {/* <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all-factories"
                        checked={userData.factoryAccess.length === factories.length}
                        onCheckedChange={(checked) => {
                            setUserData((prev) => ({
                                ...prev,
                                factoryAccess: checked ? factories.map((f) => f.id) : [],
                                buildingAccess: [],
                                floorAccess: [],
                                lineAccess: [],
                            }));
                        }}
                        disabled={isReadOnly}
                    />
                    <Label htmlFor="select-all-factories" className="text-sm">Truy cập tất cả nhà máy</Label>
                </div> */}
            </div>
            {/* {errors.factoryAccess && <p className="text-sm text-red-500">{errors.factoryAccess}</p>} */}
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
                  <Label htmlFor={`factory-${factory.id}`} className="text-sm cursor-pointer">
                    {factory.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Building Access */}
          {userData.factoryAccess.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Quyền Truy Cập Tòa nhà (Để trống cho tất cả trong nhà máy đã chọn)</Label>
                {/* <div className="flex items-center space-x-2">
                    <Checkbox
                        id="select-all-buildings"
                        checked={userData.buildingAccess.length === buildings.length}
                        onCheckedChange={(checked) => {
                            setUserData((prev) => ({
                                ...prev,
                                buildingAccess: checked ? buildings.map((b) => b.id) : [],
                                floorAccess: [],
                                lineAccess: [],
                            }));
                        }}
                        disabled={isReadOnly}
                    />
                    <Label htmlFor="select-all-buildings" className="text-sm">Truy cập tất cả theo nhà máy đã chọn</Label>
                </div> */}
            </div>
              <ScrollArea>
                {/* {errors.buildingAccess && <p className="text-sm text-red-500">{errors.buildingAccess}</p>} */}
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
                                    floorAccess: prev.floorAccess.filter((floorId) => {
                                        const floor = floors.find((f) => f.id === floorId);
                                        return floor ? floor.buildingId !== building.id : true;
                                    }),
                                }));
                            }
                        }}
                        disabled={isReadOnly}
                      />
                      <Label htmlFor={`building-${building.id}`} className="text-sm">
                        {building.name} - {building.factoryName}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Advanced mode toggle and Floor/Line access */}
          {userData.buildingAccess.length > 0 && (
            <>
              {/* Toggle cho advanced mode */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced-mode"
                  checked={isAdvancedMode}
                  onCheckedChange={setIsAdvancedMode}
                  disabled={isReadOnly}
                />
                <Label htmlFor="advanced-mode">Chọn chi tiết tầng và băng chuyền ( Mặc định chọn tất cả )</Label>
              </div>

              {/* Floor Access - chỉ hiển thị khi advanced mode */}
              {isAdvancedMode && floors.length > 0 && (
                <div className="space-y-2">
                  <Label>Quyền Truy Cập Tầng</Label>
                  <ScrollArea>
                    <div className="grid grid-cols-2 gap-2">
                      {floors.map((floor) => (
                        <div key={floor.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`floor-${floor.id}`}
                            checked={userData.floorAccess.includes(floor.id)}
                            onCheckedChange={(checked) => {
                              setUserData((prev) => ({
                                ...prev,
                                floorAccess: checked 
                                  ? [...prev.floorAccess, floor.id]
                                  : prev.floorAccess.filter((id) => id !== floor.id),
                              }));
                            }}
                            disabled={isReadOnly}
                          />
                          <Label htmlFor={`floor-${floor.id}`} className="text-sm">
                            {floor.name} - {floor.buildingName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Line Access - chỉ hiển thị khi advanced mode */}
              {isAdvancedMode && lines.length > 0 && (
                <div className="space-y-2">
                  <Label>Quyền Truy Cập Băng Chuyền</Label>
                  <ScrollArea>
                    <div className="grid grid-cols-2 gap-2">
                      {lines.map((line) => (
                        <div key={line.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`line-${line.id}`}
                            checked={userData.lineAccess.includes(line.id)}
                            onCheckedChange={(checked) => {
                              setUserData((prev) => ({
                                ...prev,
                                lineAccess: checked 
                                  ? [...prev.lineAccess, line.id]
                                  : prev.lineAccess.filter((id) => id !== line.id),
                              }));
                            }}
                            disabled={isReadOnly}
                          />
                          <Label htmlFor={`line-${line.id}`} className="text-sm">
                            {line.name} - {line.floorName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
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
              <TimezoneCombobox
                value={userData.timezone}
                onValueChange={(value) => setUserData({ ...userData, timezone: value })}
                disabled={isReadOnly}
                placeholder="Chọn múi giờ..."
              />
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
              disabled={!userData.username || !userData.email || !userData.roleId || isSaving}
            >
              {isSaving ? 'Đang lưu...' : (mode === "add" ? "Thêm Người Dùng" : "Lưu Thay Đổi")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}