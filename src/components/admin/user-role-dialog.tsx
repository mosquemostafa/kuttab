"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api/api-client";
import { Label } from "@/components/ui/label";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { UserRole } from "@/shared/enums/user-role.enum";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

interface UserRoleDialogProps {
  user: UserWithDetailsDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function UserRoleDialog({ user, isOpen, onClose }: UserRoleDialogProps) {
  const t = useTranslations("adminUsers");
  const getRoleLabel = (value: UserRole) => {
    switch (value) {
      case UserRole.ADMIN:
        return t("roles.admin");
      case UserRole.SUPPORT:
        return t("roles.support");
      case UserRole.CONTENT_MANAGER:
        return t("roles.contentManager");
      case UserRole.USER:
        return t("roles.user");
      default:
        return t("roles.user");
    }
  };
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (user.role === UserRole.ADMIN) return UserRole.ADMIN;
    if (user.role === UserRole.SUPPORT) return UserRole.SUPPORT;
    if (user.role === UserRole.CONTENT_MANAGER) {
      return UserRole.CONTENT_MANAGER;
    }
    return UserRole.USER;
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateRole = async () => {
    try {
      setIsLoading(true);
      await apiClient.users.updateRole(user.id, selectedRole);
      toast.success(
        t("toasts.roleUpdated", { role: getRoleLabel(selectedRole) }),
      );
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleUpdateRole}
      title={t("dialogs.updateRoleTitle", { name: user.name || user.email })}
      description={t("dialogs.updateRoleDescription")}
      confirmText={
        isLoading
          ? t("dialogs.processing", { defaultValue: "Processing..." })
          : t("dialogs.updateRoleConfirm")
      }
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="role">{t("dialogs.roleLabel")}</Label>
          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as UserRole)}
          >
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder={t("dialogs.rolePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UserRole.USER} className="hover:bg-muted">
                {t("roles.user")}
              </SelectItem>
              <SelectItem value={UserRole.SUPPORT} className="hover:bg-muted">
                {t("roles.support")}
              </SelectItem>
              <SelectItem
                value={UserRole.CONTENT_MANAGER}
                className="hover:bg-muted"
              >
                {t("roles.contentManager")}
              </SelectItem>
              <SelectItem value={UserRole.ADMIN} className="hover:bg-muted">
                {t("roles.admin")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </ConfirmationDialog>
  );
}
