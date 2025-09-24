import RoleDialog from '@/app/admin/components/RoleDialog';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissionApi, useRoleApi } from '@/lib/api';
import { authService } from '@/lib/auth';
import type { ApiPermission, Permission, Role } from '@/lib/types';
import {
    AlertTriangle,
    Clock,
    Edit,
    Film,
    RotateCcw,
    Save,
    Settings,
    Shield,
    Ticket,
    Trash2,
    Users,
    Video
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';


const inferCategory = (key: string): 'Devices' | 'Layouts' | 'Analytics' | 'Reports' | 'Alerts' | 'Admin' | 'Users' | 'Settings' => {
    if (key.startsWith('user.')) return 'Users';
    if (key.startsWith('device.')) return 'Devices';
    if (key.startsWith('layout.')) return 'Layouts';
    if (key.startsWith('analytic.')) return 'Analytics';
    if (key.startsWith('report.')) return 'Reports';
    if (key.startsWith('alert.')) return 'Alerts';
    if (key.startsWith('settings.')) return 'Settings';
    return 'Admin';
};

const mapApiPermissionToPermission = (apiPerm: ApiPermission): Permission => ({
  key: apiPerm.key,
  label: apiPerm.name,
  description: `Cho phép ${apiPerm.name.toLowerCase()}`,
  category: inferCategory(apiPerm.key),
  critical: apiPerm.key.includes('.delete') || apiPerm.key === 'user.editPermission'
});

// const mapApiRoleToRole = (apiRole: ApiRole, index: number): Role => {
//   const roleConfigs = [
//     {
//       key: 'ADMIN',
//       label: 'Quản trị viên',
//       description: 'Quyền cao nhất, có thể truy cập tất cả tính năng',
//       icon: <Crown className="w-5 h-5" />,
//       color: 'red',
//       userCount: 3
//     },
//   ];
  
//   const config = roleConfigs.find(c => c.label.toLowerCase() === apiRole.name.toLowerCase()) || roleConfigs[index % roleConfigs.length];
  
//   return {
//     ...config,
//     key: apiRole.name.toUpperCase(),
//     permissions: apiRole.permissions || (apiRole.name.toLowerCase() === 'admin' ? [] : []),
//   };
// };


const RolePermissionManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [permResponse, roleResponse] = await Promise.all([
            usePermissionApi().getPermissions(),
            useRoleApi().getRoles()
        ]);
        const mappedPermissions = permResponse.map(mapApiPermissionToPermission);
        setPermissions(mappedPermissions);
        // const mappedRoles = roleResponse.map((role: ApiRole, index: number) => mapApiRoleToRole(role, index));
        // console.log('Fetched Roles:', mappedRoles, roleResponse);
        setRoles(roleResponse);
        setSelectedRole(roleResponse[0]?.id || '');
      } catch (err) {
        toast.error('Lỗi khi tải dữ liệu: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    fetchData();
  }, [open]);

  if (!open) return null;

  const currentRole = roles.find(r => r.id === selectedRole);


  const getRoleDetail = async (roleId: string) => {
    try {
        return await useRoleApi().getRoleById(roleId);
    } catch (error) {
        console.error('Error fetching role details:', error);
        throw error;
    }
  }

useEffect(() => {
    const fetchRoleDetail = async () => {
        if (!selectedRole) return;
        try {
            const role = await getRoleDetail(selectedRole);
            setRoles(prevRoles => prevRoles.map(r => r.id === role.id ? role : r));
            setHasChanges(false);
        } catch (err) {
            toast.error('Không thể tải chi tiết vai trò: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };
    fetchRoleDetail();
}, [selectedRole]);

  const getPermissionsByCategory = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const isPermissionChecked = (permissionKey: string) => {
    return currentRole?.permissions?.includes(permissionKey) || false;
  };

  const handlePermissionChange = (permissionKey: string, checked: boolean) => {
    if (!currentRole) return;

    setRoles(prev => prev.map(role => {
      if (role.id === selectedRole) {
        const newPermissions = checked
          ? [...role.permissions ?? [], permissionKey]
          : role.permissions?.filter(p => p !== permissionKey);
        
        return { ...role, permissions: newPermissions };
      }
      return role;
    }));
    
    setHasChanges(true);
  };

  const handleSelectAllCategory = (category: string, checked: boolean) => {
    const categoryPermissions = getPermissionsByCategory(category).map(p => p.key);
    
    if (!currentRole) return;

    setRoles(prev => prev.map(role => {
      if (role.id === selectedRole) {
        let newPermissions;
        if (checked) {
          newPermissions = [...new Set([...role.permissions ?? [], ...categoryPermissions])];
        } else {
          newPermissions = role.permissions?.filter(p => !categoryPermissions.includes(p));
        }
        
        return { ...role, permissions: newPermissions };
      }
      return role;
    }));
    
    setHasChanges(true);
  };

  const isCategoryFullyChecked = (category: string) => {
    const categoryPermissions = getPermissionsByCategory(category);
    return categoryPermissions.every(p => isPermissionChecked(p.key));
  };

  const isCategoryPartiallyChecked = (category: string) => {
    const categoryPermissions = getPermissionsByCategory(category);
    const checkedCount = categoryPermissions.filter(p => isPermissionChecked(p.key)).length;
    return checkedCount > 0 && checkedCount < categoryPermissions.length;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        if (!currentRole) return;
        console.log('Saving permissions for role:', currentRole);

        if (!currentRole.id) {
            throw new Error('Vai trò không hợp lệ');
        }
        
        const response = await usePermissionApi().updateRolePermissions(currentRole.id, currentRole.permissions || []);
        console.log('Update response:', response);
        if (response) {
            setHasChanges(false);
            // Optionally, refetch roles to ensure data consistency
            const updatedRole = await getRoleDetail(currentRole.id);
            setRoles(prevRoles => prevRoles.map(r => r.id === updatedRole.id ? updatedRole : r));

            toast.success('Lưu thành công!', {
                description: `Quyền của ${currentRole.name} đã được cập nhật.`,
            });
            setLoading(false);
        } else {
            throw new Error('Failed to update permissions');
        }
    } catch (err) {
        toast.error('Lưu thất bại: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
    };

  const handleReset = async () => {
    try {
        if (!currentRole || !currentRole.id) {
            throw new Error('Vai trò không hợp lệ');
        }
        const role = await getRoleDetail(selectedRole);
        setRoles(prevRoles => prevRoles.map(r => r.id === role.id ? role : r));
        setHasChanges(false);
    } catch (err) {
        toast.error('Lỗi khi đặt lại: ' + (err instanceof Error ? err.message : 'Unknown error'));
        console.error('Error resetting roles:', err);
    }
  };

  const getRoleColor = (color: string) => {
    const colors = {
      red: 'bg-red-50 border-red-200 text-red-700',
      blue: 'bg-blue-50 border-blue-200 text-blue-700',
      green: 'bg-green-50 border-green-200 text-green-700',
      purple: 'bg-purple-50 border-purple-200 text-purple-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

    const getCategoryIcon = (category: string) => {
        switch (category) {
        case 'Users': return <Users className="w-5 h-5 text-gray-600" />;
        case 'Devices': return <Video className="w-5 h-5 text-gray-600" />;
        case 'Layouts': return <Film className="w-5 h-5 text-gray-600" />;
        case 'Analytics': return <Clock className="w-5 h-5 text-gray-600" />;
        case 'Reports': return <Ticket className="w-5 h-5 text-gray-600" />;
        case 'Alerts': return <AlertTriangle className="w-5 h-5 text-gray-600" />;
        case 'Settings': return <Settings className="w-5 h-5 text-gray-600" />;
        default: return <Shield className="w-5 h-5 text-gray-600" />;
        }
    };

    const getCategoryName = (category: string) => {
        switch (category) {
        case 'Users': return 'Người dùng';
        case 'Devices': return 'Thiết bị';
        case 'Layouts': return 'Bố cục';
        case 'Analytics': return 'Phân tích';
        case 'Reports': return 'Báo cáo';
        case 'Alerts': return 'Cảnh báo';
        case 'Settings': return 'Cài đặt';
        default: return 'Quản trị';
        }
    };

    const handleAddRole = () => {
      setRoleDialogMode('add');
      setSelectedRoleForEdit(null);
      setIsRoleDialogOpen(true);
    };

    const handleEditRole = (role: Role) => {
      setRoleDialogMode('edit');
      setSelectedRoleForEdit(role);
      setIsRoleDialogOpen(true);
    };

    const handleDeleteRole = async (role: Role) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${role.name}" không? Hành động này không thể hoàn tác.`)) {
            return;
        }
        try {
            await useRoleApi().deleteRole(role.id);
            setRoles(prev => prev.filter(r => r.id !== role.id));
            toast.success('Xóa thành công!');
        } catch (error) {
            toast.error('Xóa thất bại: ' + error.error || (error instanceof Error ? error.message : 'Unknown error'));
        }
    };


    const handleSaveRole = async (roleData: Omit<Role, 'id' | 'permissions' | 'userCount' | 'permissionCount'>) => {
      try {
        if (roleDialogMode === 'add') {
          // Call API to create new role with default permissions
          const newRoleData = {
            ...roleData,
            permissions: [] // Start with no permissions
          };
          const newRole = await useRoleApi().createRole(newRoleData);
          setRoles(prev => [newRole, ...prev]);
          setSelectedRole(newRole.id);
          toast.success('Thêm vai trò thành công!');
        } else if (roleDialogMode === 'edit' && selectedRoleForEdit) {
          // Call API to update role
          const updatedRole = await useRoleApi().updateRole(selectedRoleForEdit.id, {description: roleData.description});
          setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
          toast.success('Cập nhật vai trò thành công!');
        }
      } catch (error) {
        throw error; // Re-throw to let dialog handle the error
      } finally {
        // setIsRoleDialogOpen(false);
        // setSelectedRoleForEdit(null);
        // setRoleDialogMode('add');
        fetchData();
      }
    };

//   if (loading) {
//     return (
//       <div className="inset-0 z-50 flex items-center justify-center p-4 ">
//         <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] p-6">
//           <p className="text-gray-600">Đang tải dữ liệu...</p>
//         </div>
//       </div>
//     );
//   }


  return (
    <div className="inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg border-2 border-gray-200 w-full max-h-[82vh] overflow-hidden z-20 ">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-purple-200">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Quản lý phân quyền
                </CardTitle>
                <CardDescription>Cấu hình quyền hạn cho từng vai trò trong hệ thống</CardDescription>
            </div>
            <div className="flex items-center gap-3">
                {hasChanges && (
                    <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Có thay đổi chưa lưu
                    </div>
                )}
            </div>
        </CardHeader>

        {/* Content */}
        <div className="flex h-[calc(80vh-140px)]">
          {/* Role List */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
                <PermissionGuard permission="role.create">
                <button
                  onClick={handleAddRole}
                  className='bg-black rounded-lg text-white px-4 py-2 mb-4 border-white border-2 hover:text-black hover:border-black hover:bg-white transition-colors duration-200 w-full flex items-center justify-center gap-2'
                >Thêm</button>
              </PermissionGuard>
              <h3 className="font-semibold text-gray-700 mb-4">Danh sách vai trò</h3>
              <div className="space-y-2">
                {roles.map((role) => (
                <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 text-left shadow-sm
                        ${selectedRole === role.id
                            ? 'border-black bg-gray-600 text-white'
                            : 'border-gray-200 bg-white hover:border-black hover:bg-gray-50'
                        }`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className={`font-semibold ${selectedRole === role.id ? 'text-white' : 'text-black'}`}>{role.name}</span>
                        <div className="flex items-center gap-2">
                            <PermissionGuard permission="role.edit"
                                fallback={<Button variant="ghost" size="sm" disabled><Edit className="h-4 w-4" /></Button>}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleEditRole(role); }}
                                    className={selectedRole === role.id ? 'text-white' : 'text-black'}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="role.delete"
                                fallback={<Button variant="ghost" size="sm" disabled><Trash2 className="h-4 w-4" /></Button>}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                                    className={selectedRole === role.id ? 'text-white' : 'text-black'}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </PermissionGuard>
                        </div>
                    </div>
                    <p className={`text-sm mb-2 ${selectedRole === role.id ? 'text-gray-200' : 'text-gray-600'}`}>{role.description}</p>
                    <div className="flex justify-between items-center text-xs">
                        <span className={selectedRole === role.id ? 'text-gray-200' : 'text-gray-500'}>{role.userCount || 0} người dùng</span>
                        <span className={selectedRole === role.id ? 'text-gray-200' : 'text-gray-500'}>{role.permissionCount || role.permissions?.length || 0} quyền</span>
                    </div>
                </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Configuration */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentRole && (
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{currentRole.name}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{currentRole.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{currentRole.userCount || 0} người dùng</span>
                    <span>{currentRole.permissionCount || currentRole.permissions?.length || 0} quyền được cấp</span>
                  </div>
                </div>

                {/* Permission Categories */}
                <div className="space-y-6">
                  {[ 'Devices', 'Layouts', 'Analytics', 'Reports', 'Alerts', 'Admin', 'Users', 'Settings'].map((category) => {
                    const categoryPermissions = getPermissionsByCategory(category);
                    const isFullyChecked = isCategoryFullyChecked(category);
                    const isPartiallyChecked = isCategoryPartiallyChecked(category);

                    return (
                      <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Category Header */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getCategoryIcon(category)}
                              <h4 className="font-semibold text-gray-900">
                                {getCategoryName(category)}
                              </h4>
                              <span className="text-sm text-gray-500">
                                ({categoryPermissions.filter(p => isPermissionChecked(p.key)).length}/{categoryPermissions.length})
                              </span>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                disabled={!authService.hasPermission('role.edit')}
                                type="checkbox"
                                checked={isFullyChecked}
                                ref={(input) => {
                                  if (input) input.indeterminate = isPartiallyChecked;
                                }}
                                onChange={(e) => handleSelectAllCategory(category, e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-700">Chọn tất cả</span>
                            </label>
                          </div>
                        </div>

                        {/* Permissions List */}
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryPermissions.map((permission) => (
                              <label
                                key={permission.key}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  isPermissionChecked(permission.key)
                                    ? 'bg-purple-50 border-purple-200'
                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                } ${permission.critical ? 'ring-1 ring-red-200' : ''}`}
                              >
                                <input
                                    disabled={!authService.hasPermission('role.edit')}
                                  type="checkbox"
                                  checked={isPermissionChecked(permission.key)}
                                  onChange={(e) => handlePermissionChange(permission.key, e.target.checked)}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium text-gray-900">
                                      {permission.label}
                                    </div>
                                    {permission.critical && (
                                      <div className="flex items-center gap-1 text-red-600">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="text-xs">Quan trọng</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {permission.description}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              ⚠️ Thay đổi quyền hạn sẽ ảnh hưởng đến tất cả người dùng có vai trò này
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Đặt lại
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || loading || !authService.hasPermission('role.edit')}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                  hasChanges
                    ? 'bg-black text-white cursor-pointer hover:bg-white hover:text-black hover:border-black border-2'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
                    ${loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {loading ? (<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900'></div>) : (
                  hasChanges ? (<div className='flex items-center gap-2'><Save className="w-4 h-4" /> Lưu</div>) : 'Không có thay đổi'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Dialog */}
      <RoleDialog
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        onSave={handleSaveRole}
        role={selectedRoleForEdit}
        mode={roleDialogMode}
      />
    </div>
  );
};

export default RolePermissionManager;