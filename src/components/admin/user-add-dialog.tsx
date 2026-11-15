"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useLocale, useTranslations } from "next-intl";
import { apiClient } from "@/lib/api/api-client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";
import { UserRole } from "@/shared/enums/user-role.enum";

interface UserAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserAddDialog({
  isOpen,
  onClose,
  onSuccess,
}: UserAddDialogProps) {
  type RoleOption = UserRole;

  const t = useTranslations("adminUsers");
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.USER as RoleOption,
    autoVerify: false,
  });

  const handleClose = () => {
    if (isLoading) return;
    onClose();
    // Reset form
    setFormData({
      name: "",
      email: "",
      password: "",
      role: UserRole.USER,
      autoVerify: false,
    });
  };

  const handleCreateUser = async () => {
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPassword = formData.password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      toast.error(t("dialogs.addUserValidation"));
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.users.create({
        name: trimmedName,
        email: trimmedEmail,
        password: trimmedPassword,
        role: formData.role,
        autoVerify: formData.autoVerify,
      });
      toast.success(
        formData.autoVerify
          ? t("toasts.userCreatedVerified")
          : t("toasts.userCreated"),
      );
      onSuccess?.();
      handleClose();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        dir={locale.startsWith("ar") ? "rtl" : "ltr"}
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("dialogs.addUserTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialogs.addUserDescription")}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreateUser();
          }}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="create-user-name">{t("dialogs.nameLabel")}</Label>
            <Input
              id="create-user-name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder={t("dialogs.namePlaceholder")}
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-user-email">{t("dialogs.emailLabel")}</Label>
            <Input
              id="create-user-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder={t("dialogs.emailPlaceholder")}
              disabled={isLoading}
              dir="ltr"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-user-password">
              {t("dialogs.passwordLabel")}
            </Label>
            <Input
              id="create-user-password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder={t("dialogs.passwordPlaceholder")}
              disabled={isLoading}
              dir="ltr"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="create-user-role">{t("dialogs.roleLabel")}</Label>
            <Select
              value={formData.role}
              onValueChange={(value: RoleOption) =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
              disabled={isLoading}
            >
              <SelectTrigger id="create-user-role" className="w-full">
                <SelectValue placeholder={t("dialogs.rolePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.USER}>{t("roles.user")}</SelectItem>
                <SelectItem value={UserRole.SUPPORT}>
                  {t("roles.support")}
                </SelectItem>
                <SelectItem value={UserRole.CONTENT}>
                  {t("roles.content")}
                </SelectItem>
                <SelectItem value={UserRole.STUDENT}>
                  {t("roles.student")}
                </SelectItem>
                <SelectItem value={UserRole.PARENT}>
                  {t("roles.parent")}
                </SelectItem>
                <SelectItem value={UserRole.ADMIN}>
                  {t("roles.admin")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="create-user-autoVerify" className="cursor-pointer">
              {t("dialogs.autoVerifyLabel")}
            </Label>
            <Switch
              id="create-user-autoVerify"
              checked={formData.autoVerify}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, autoVerify: checked }))
              }
              disabled={isLoading}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t("dialogs.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? t("dialogs.addUserCreating")
                : t("dialogs.addUserConfirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
