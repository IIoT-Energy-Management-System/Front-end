"use client"

import { PermissionGuard } from "@/components/PermissionGuard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserApiService } from "@/lib/api"
import type { User } from "@/lib/types"
import { ChevronLeft, ChevronRight, Edit, Eye, Plus, Trash2, Users } from "lucide-react"
import { useEffect, useState } from "react"
import UserDialogModal from "../components/UserDialogModal"
import { toast } from "sonner"

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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

//   const { factories } = useAppStore()

    const loadData = async () => {
        try {
        const userList = await UserApiService.getUsers()
        setUsers(userList)
        setCurrentPage(1) // Reset to first page when loading new data
        } catch (error) {
        console.error("Failed to load users:", error)
        }
    }

  useEffect(() => {
    loadData()
  }, [])

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

  const handleSaveUser = async () => {
    await loadData();
  }

  const handleDeleteUser = async (user: User) => {
    // Xác nhận trước khi xóa
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng ${user.username} này?`)) {
      return;
    }

    try {
      if (!user.id) {
        alert("Không thể xóa người dùng: ID không xác định.");
        return;
      }
      await UserApiService.deleteUser(user.id);
      // Tải lại danh sách người dùng sau khi xóa
      toast.success("Người dùng đã được xóa thành công.");
      await loadData();
    } catch (error) {
      console.error("Failed to delete user:", error);
        toast.error("Có lỗi xảy ra khi xóa người dùng. Vui lòng thử lại.");
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = users.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToPreviousPage = () => {
    goToPage(currentPage - 1)
  }

  const goToNextPage = () => {
    goToPage(currentPage + 1)
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
            <PermissionGuard permission="user.create" >
                <Button onClick={openAddDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Người Dùng
                </Button>
            </PermissionGuard>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Người Dùng</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai Trò</TableHead>
                <TableHead>Cấp Độ Truy Cập</TableHead>
                <TableHead>Ngôn Ngữ</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "Admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {user.factoryAccess.length === 0 && user.buildingAccess.length === 0 && user.floorAccess.length === 0 && user.lineAccess.length === 0
                          ? "Tất cả nhà máy"
                          : ""}
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
                        <PermissionGuard permission="user.edit"
                        fallback={<Button variant="ghost" size="sm" disabled><Edit className="h-4 w-4" /></Button>}
                        >
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                          </PermissionGuard>
                          <PermissionGuard permission="user.delete"
                          fallback={<Button variant="ghost" size="sm" disabled><Trash2 className="h-4 w-4" /></Button>}
                        >
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                          </PermissionGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Không có người dùng nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {startIndex + 1}-{Math.min(endIndex, users.length)} của {users.length} người dùng
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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