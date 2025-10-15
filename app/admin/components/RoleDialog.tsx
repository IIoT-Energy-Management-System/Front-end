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
import type { Role } from "@/lib/types";
import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

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
    const { t } = useTranslation();

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
      newErrors.name = `${t("role.requiredRoleName")}`;
    } else if (name.trim().length < 2) {
      newErrors.name = `${t("role.minRoleNameLength")}`;
    } else if (name.trim().length > 50) {
      newErrors.name = `${t("role.maxRoleNameLength")}`;
    }

    if (!description.trim()) {
      newErrors.description = `${t("role.requiredDescription")}`;
    } else if (description.trim().length < 10) {
      newErrors.description = `${t("role.minDescriptionLength")}`;
    } else if (description.trim().length > 200) {
      newErrors.description = `${t("role.maxDescriptionLength")}`;
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

      toast.success( mode === 'add' ? t("role.addSuccess") : t("role.updateSuccess"));

      onClose();
    } catch (error) {
      toast.error(
        mode === 'add' ? t("role.addError") : t("role.updateError"),
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
            {mode === 'add' ? t("role.addNew") : t("role.editRole")}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? t("role.addDescription")
              : t("role.editDescription")
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-6 items-center gap-4">
            <Label htmlFor="name" className="text-right col-span-2">
              {t("role.roleName")} *
            </Label>
            <div className="col-span-4">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("role.roleNamePlaceholder")}
                className={errors.name ? 'border-red-500' : ''}
                maxLength={50}
                disabled={mode === 'edit'} // Disable editing name in edit mode
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-6 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2 col-span-2">
              {t("role.roleDescription")} *
            </Label>
            <div className="col-span-4">
              <textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t("role.roleDescriptionPlaceholder")}
                className={`min-h-[80px] w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-500">{errors.description}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    {t("role.description")}
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
            {t("common.cancel")}
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
                {t("common.saving")}
              </div>
            ) : (
              mode === 'add' ? t("common.add") : t("common.edit")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleDialog;