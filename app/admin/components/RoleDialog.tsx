import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import type { Role } from "@/lib/types";
import React, { useEffect, useState } from 'react';
import { toast } from "sonner";

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Omit<Role, 'id' | 'permissions' | 'userCount' | 'permissionCount'>) => void;
  role?: Role | null; // null for add, Role object for edit
  mode: 'add' | 'edit';
}

const RoleDialog: React.FC<RoleDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  role,
  mode
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{name?: string; description?: string}>({});

  // Reset form when dialog opens/closes or role changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setName(role.name);
        setDescription(role.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setErrors({});
    }
  }, [isOpen, mode, role]);

  const validateForm = (): boolean => {
    const newErrors: {name?: string; description?: string} = {};

    if (!name.trim()) {
      newErrors.name = 'Tên vai trò không được để trống';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Tên vai trò phải có ít nhất 2 ký tự';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Tên vai trò không được vượt quá 50 ký tự';
    }

    if (!description.trim()) {
      newErrors.description = 'Mô tả không được để trống';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Mô tả phải có ít nhất 10 ký tự';
    } else if (description.trim().length > 200) {
      newErrors.description = 'Mô tả không được vượt quá 200 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const roleData = {
        name: name.trim(),
        description: description.trim(),
      };

      await onSave(roleData);

      toast.success(
        mode === 'add' ? 'Thêm vai trò thành công!' : 'Cập nhật vai trò thành công!',
        {
          description: `Vai trò "${name}" đã được ${mode === 'add' ? 'thêm' : 'cập nhật'}.`
        }
      );

      onClose();
    } catch (error) {
      toast.error(
        mode === 'add' ? 'Thêm vai trò thất bại' : 'Cập nhật vai trò thất bại',
        {
          description: error instanceof Error ? error.message : 'Có lỗi xảy ra'
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Thêm vai trò mới' : 'Chỉnh sửa vai trò'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Tạo một vai trò mới với tên và mô tả phù hợp.'
              : 'Cập nhật thông tin của vai trò hiện tại.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên vai trò *
            </Label>
            <div className="col-span-3">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tên vai trò"
                className={errors.name ? 'border-red-500' : ''}
                maxLength={50}
                disabled={mode === 'edit'} // Disable editing name in edit mode
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Mô tả *
            </Label>
            <div className="col-span-3">
              <textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Nhập mô tả chi tiết về vai trò này"
                className={`min-h-[80px] w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Mô tả vai trò và quyền hạn của nó
                  </p>
                )}
                <span className="text-xs text-gray-400">
                  {description.length}/200
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !name.trim() || !description.trim()}
            className="bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-colors"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang lưu...
              </div>
            ) : (
              mode === 'add' ? 'Thêm vai trò' : 'Lưu thay đổi'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDialog;