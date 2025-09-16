"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserApiService } from "@/lib/api"
import type { User } from "@/lib/types"
import { Edit, Eye, Plus, Trash2, Users } from "lucide-react"
import { useEffect, useState } from "react"
import UserDialogModal from "../components/UserDialogModal"

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit' | 'view'
    user: User | null
  }>({
    isOpen: false,
    mode: 'add',
    user: null,
  })

//   const { factories } = useAppStore()

    const loadData = async () => {
        try {
        const userList = await UserApiService.getUsers()
        setUsers(userList)
        } catch (error) {
        console.error("Failed to load users:", error)
        }
    }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddUser = async (userData: User) => {
    try {
        await UserApiService.createUser(userData)
        loadData()
        // Chỉ hiện alert khi tạo thành công
        alert("Thêm người dùng thành công!")
        console.log("Add user data:", userData)
    } catch (error) {
      console.error("Failed to add user:", error)
    }
  }

//   const handleEditUser = async (userData: User) => {
//     if (!dialogState.user) return

//     try {
//       await db.updateUser(dialogState.user.id, {
//         ...userData,
//       } as User)
//       loadData()
//     } catch (error) {
//       console.error("Failed to update user:", error)
//     }
//   }

  const openAddDialog = () => {
    setDialogState({
      isOpen: true,
      mode: 'add',
      user: null,
    })
  }

  const openEditDialog = (user: User) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      user,
    })
  }

  const openViewDialog = (user: User) => {
    setDialogState({
      isOpen: true,
      mode: 'view',
      user,
    })
  }

  const closeDialog = () => {
    setDialogState({
      isOpen: false,
      mode: 'add',
      user: null,
    })
  }

  const handleSaveUser = async (userData: User) => {
    await loadData();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Quản Lý Người Dùng
            </CardTitle>
            <CardDescription>Quản lý tài khoản người dùng và quyền truy cập</CardDescription>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Người Dùng
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Đăng Nhập</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai Trò</TableHead>
                <TableHead>Cấp Độ Truy Cập</TableHead>
                <TableHead>Ngôn Ngữ</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "Administrator" ? "default" : "secondary"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {user.factoryAccess.length > 0 && `${user.factoryAccess.length} Nhà Máy`}
                      {user.buildingAccess.length > 0 && `, ${user.buildingAccess.length} Tòa Nhà`}
                      {user.floorAccess.length > 0 && `, ${user.floorAccess.length} Tầng`}
                      {user.lineAccess.length > 0 && `, ${user.lineAccess.length} Dây Chuyền`}
                    </div>
                  </TableCell>
                  <TableCell>{user.language === "en" ? "Tiếng Anh" : "Tiếng Việt"}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Hoạt Động" : "Không Hoạt Động"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openViewDialog(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserDialogModal
        isOpen={dialogState.isOpen}
        onClose={closeDialog}
        mode={dialogState.mode}
        user={dialogState.user}
        onSave={handleSaveUser}
      />
    </>
  )
}