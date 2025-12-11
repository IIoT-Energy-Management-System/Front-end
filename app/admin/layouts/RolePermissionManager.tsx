import RoleDialog from '@/app/admin/components/RoleDialog';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Button } from '@/components/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissionApi, useRoleApi } from '@/lib/api';
import { authService } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import type { ApiPermission, Permission, Role } from '@/lib/types';
import {
    AlertTriangle,
    Clock,
    Edit,
    Film,
    Plus,
    RotateCcw,
    Save,
    Settings,
    Shield,
    Ticket,
    Trash2,
    Users,
    Video
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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
    const { t } = useTranslation();

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

    const permissionsRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);
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
        if (selectedRole && permissionsRef.current && tableRef.current) {
            permissionsRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            tableRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
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

  const handleAlertSeverityChange = (severity: string, checked: boolean) => {
    if (!currentRole) return;
    
    setRoles(prev => prev.map(role => {
      if (role.id === selectedRole) {
        const currentSeverities = role.alertSeverity || [];
        const newSeverities = checked
          ? [...currentSeverities, severity]
          : currentSeverities.filter(s => s !== severity);
        
        return { ...role, alertSeverity: newSeverities };
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

        if (!currentRole.id) {
            throw new Error('Vai trò không hợp lệ');
        }
        
        // Update permissions
        await usePermissionApi().updateRolePermissions(currentRole.id, currentRole.permissions || []);
        
        // Update role (including alertSeverity)
        await useRoleApi().updateRole(currentRole.id, {
            description: currentRole.description,
            alertSeverity: currentRole.alertSeverity
        });
        setHasChanges(false);
        // Optionally, refetch roles to ensure data consistency
        const updatedRole = await getRoleDetail(currentRole.id);
        setRoles(prevRoles => prevRoles.map(r => r.id === updatedRole.id ? updatedRole : r));

        toast.success('Lưu thành công!', {
                description: `Quyền của ${currentRole.name} đã được cập nhật.`,
            });
            setLoading(false);
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
        case 'Users': return `${t("settings.users")}`;
        case 'Devices': return `${t("nav.devices")}`;
        case 'Layouts': return `${t("nav.layouts")}`;
        case 'Analytics': return `${t("nav.analytics")}`;
        case 'Reports': return `${t("nav.reports")}`;
        case 'Alerts': return `${t("nav.alerts")}`;
        case 'Settings': return `${t("common.settings")}`;
        default: return `${t("nav.admin")}`;
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
            fetchData();
            setSelectedRole(prev => (prev === role.id ? (roles[0]?.id || '') : prev));
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
    <div ref={tableRef} className="inset-0 z-50 flex items-center justify-center px-4 lg:px-0">
      <div className="bg-white rounded-lg border-2 border-gray-200 w-full sm:max-h-[100vh] overflow-hidden z-20">
        {/* Header */}
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-purple-200 p-4 sm:p-6">
            <div className="mb-3 sm:mb-0">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Shield className="h-5 w-5" />
                    {t("role.title")}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">{t("role.description")}</CardDescription>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {hasChanges && (
                    <div className="text-xs sm:text-sm text-amber-600 bg-amber-50 px-2 sm:px-3 py-1 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="inline">{t("role.unsavedChanges")}</span>
                    </div>
                )}
            </div>
        </CardHeader>

        {/* Content */}
        <div className="flex flex-col gap-4 lg:gap-0 lg:flex-row lg:h-[calc(100vh-240px)] *:border-t-2 *:border-gray-200">
          {/* Role List */}
          <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto max-h-96 lg:max-h-none">
            <div className="p-4">
                <PermissionGuard permission="role.create">
                <button
                  onClick={handleAddRole}
                  className='bg-black rounded-lg text-white px-3 sm:px-4 py-2 mb-4 border-white border-2 hover:text-black hover:border-black hover:bg-white transition-colors duration-200 w-full flex items-center justify-center gap-2 text-sm sm:text-base'
                >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    {t("role.addNew")}</button>
              </PermissionGuard>
              <h3 className="font-semibold text-gray-700 mb-4 text-sm sm:text-base">{t("role.list")}</h3>
              <div className="space-y-2">
                {roles.map((role) => (
                <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full px-3 sm:px-4 py-3 rounded-xl border transition-all duration-200 text-left shadow-sm
                        ${selectedRole === role.id
                            ? 'border-black bg-gray-600 text-white'
                            : 'border-gray-200 bg-white hover:border-black hover:bg-gray-50'
                        }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className={`font-semibold text-sm sm:text-base ${selectedRole === role.id ? 'text-white' : 'text-black'}`}>{role.name}</span>
                        <div className="flex items-center gap-1 sm:gap-2 ml-2">
                            <PermissionGuard permission="role.edit"
                                fallback={<Button variant="ghost" size="sm" disabled><Edit className="h-3 w-3 sm:h-4 sm:w-4" /></Button>}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleEditRole(role); }}
                                    className={selectedRole === role.id ? 'text-white' : 'text-black'}
                                >
                                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            </PermissionGuard>
                            <PermissionGuard permission="role.delete"
                                fallback={<Button variant="ghost" size="sm" disabled><Trash2 className="h-3 w-3 sm:h-4 sm:w-4" /></Button>}
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteRole(role); }}
                                    className={selectedRole === role.id ? 'text-white' : 'text-black'}
                                >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            </PermissionGuard>
                        </div>
                    </div>
                    <p className={`text-xs sm:text-sm mb-2 ${selectedRole === role.id ? 'text-gray-200' : 'text-gray-600'}`}>{role.description}</p>
                    <div className="flex justify-between items-center text-xs">
                        <span className={selectedRole === role.id ? 'text-gray-200' : 'text-gray-500'}>{role.userCount || 0} {t("user")}</span>
                        <span className={selectedRole === role.id ? 'text-gray-200' : 'text-gray-500'}>{role.permissionCount || role.permissions?.length || 0} {t("role.permissions").toLowerCase()}</span>
                    </div>
                </button>
                ))}
              </div>
            </div>
          </div>

          {/* Permissions Configuration */}
          <div ref={permissionsRef} className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-96 lg:max-h-none">
            {currentRole && (
              <div>
                <div className="mb-4 sm:mb-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 justify-center items-center">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{currentRole.name}</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{currentRole.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <span>{currentRole.userCount || 0} {t("user")}</span>
                    <span>{currentRole.permissionCount || currentRole.permissions?.length || 0} {t("role.permissions").toLowerCase()}</span>
                  </div>

                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        {/* <Mail className="w-5 h-5" /> */}
                        Email Alert Notifications
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                        Select which alert severity types this role should receive via email
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {['Critical', 'High', 'Medium', 'Low', 'Info'].map((severity) => (
                        <label
                            key={severity}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                            currentRole.alertSeverity?.includes(severity)
                                ? 'bg-purple-100 border-purple-300'
                                : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            <input
                            type="checkbox"
                            checked={currentRole.alertSeverity?.includes(severity) || false}
                            onChange={(e) => handleAlertSeverityChange(severity, e.target.checked)}
                            disabled={!authService.hasPermission('role.edit')}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="font-medium text-sm">{severity}</span>
                        </label>
                        ))}
                    </div>
                    </div>
                  </div>
                </div>

                {/* Permission Categories */}
                <div className="space-y-4 sm:space-y-6">
                  {[ 'Devices', 'Layouts', 'Analytics', 'Reports', 'Alerts', 'Admin', 'Users', 'Settings'].map((category) => {
                    const categoryPermissions = getPermissionsByCategory(category);
                    const isFullyChecked = isCategoryFullyChecked(category);
                    const isPartiallyChecked = isCategoryPartiallyChecked(category);

                    return (
                      <div key={category} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Category Header */}
                        <div className="bg-gray-50 px-3 sm:px-4 py-3 border-b border-gray-200">
                          <div className="flex sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {getCategoryIcon(category)}
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {getCategoryName(category)}
                              </h4>
                              <span className="text-xs sm:text-sm text-gray-500">
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
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                              />
                              <span className="text-xs sm:text-sm text-gray-700">{t("filters.selectAll")}</span>
                            </label>
                          </div>
                        </div>

                        {/* Permissions List */}
                        <div className="p-3 sm:p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            {categoryPermissions.map((permission) => (
                              <label
                                key={permission.key}
                                className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
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
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 mt-1 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                      {permission.label}
                                    </div>
                                    {permission.critical && (
                                      <div className="flex items-center gap-1 text-red-600 flex-shrink-0">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span className="text-xs hidden sm:inline">{t("role.critical")}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
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
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-gray-600">
              ⚠️ {t("role.permissionChangeWarning")}
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleReset}
                className="px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base flex-1 sm:flex-none"
              >
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="inline">{t("common.reset")}</span>
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || loading || !authService.hasPermission('role.edit')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base flex-1 sm:flex-none ${
                  hasChanges
                    ? 'bg-black text-white cursor-pointer hover:bg-white hover:text-black hover:border-black border-2'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
                    ${loading ? 'opacity-70 cursor-wait' : ''}`}
              >
                {loading ? (<div className='animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-gray-900'></div>) : (
                  hasChanges ? (<div className='flex items-center gap-1 sm:gap-2'><Save className="w-3 h-3 sm:w-4 sm:h-4" /> {t("common.save")}</div>) : `${t("common.noChanges")}`
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