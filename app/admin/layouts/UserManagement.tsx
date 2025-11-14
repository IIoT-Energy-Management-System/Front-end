"use client"

import { PermissionGuard } from "@/components/PermissionGuard"
import { CustomPagination } from "@/components/custom-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserApiService } from "@/lib/api"
import { useTranslation } from "@/lib/i18n"
import type { User } from "@/lib/types"
import { Edit, Eye, Plus, Trash2, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import UserDialogModal from "../components/UserDialogModal"

export default function UserManagement() {
  const { t } = useTranslation()
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
    if (!confirm(`${t("user.deleteConfirm")}`)) {
      return;
    }

    try {
      if (!user.id) {
        alert("Không thể xóa người dùng: ID không xác định.");
        return;
      }
      await UserApiService.deleteUser(user.id);
      // Tải lại danh sách người dùng sau khi xóa
      toast.success(`${t("user.deleteSuccess")}`);
      await loadData();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(`${t("user.deleteError")}`);
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(users.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = users.slice(startIndex, endIndex)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("user.title")}
            </CardTitle>
            <CardDescription>{t("user.description")}</CardDescription>
          </div>
            <PermissionGuard permission="user.create" >
                <Button onClick={openAddDialog} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("user.addNew")}
                </Button>
            </PermissionGuard>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("user.username")}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>{t("user.role")}</TableHead>
                <TableHead>{t("user.accessLevel")}</TableHead>
                <TableHead>{t("user.language")}</TableHead>
                <TableHead>{t("alerts.status")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium truncate max-w-32">{user.username}</TableCell>
                    <TableCell className="truncate max-w-64">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "Admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {user.factoryAccess.length === 0 && user.buildingAccess.length === 0 && user.floorAccess.length === 0 && user.lineAccess.length === 0
                          ? t("user.fullAccess")
                          : ""}
                        {user.factoryAccess.length > 0 &&
                            `${user.factoryAccess.length} ${
                                user.factoryAccess.length === 1 ? t("layouts.factory") : t("layouts.factories")
                            }`
                        }
                        {user.buildingAccess.length > 0 &&
                            `, ${user.buildingAccess.length} ${
                                user.buildingAccess.length === 1 ? t("layouts.building") : t("layouts.buildings")
                            }`
                        }
                        {user.floorAccess.length > 0 &&
                            `, ${user.floorAccess.length} ${
                                user.floorAccess.length === 1 ? t("layouts.floor") : t("layouts.floors")
                            }`
                        }
                        {user.lineAccess.length > 0 &&
                            `, ${user.lineAccess.length} ${
                                user.lineAccess.length === 1 ? t("layouts.line") : t("layouts.lines")
                            }`
                        }
                      </div>
                    </TableCell>
                    <TableCell>{user.language === "en" ? t("common.english") : t("common.vietnamese")}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? t("common.active") : t("common.inactive")}
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
                    {t("user.noUserFound")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={users.length}
            showInfo={true}
            t={t}
            itemName={t("user")}
          />
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