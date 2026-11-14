"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api/api-client";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useTranslations } from "next-intl";

interface UserDeleteDialogProps {
  user: UserWithDetailsDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function UserDeleteDialog({
  user,
  isOpen,
  onClose,
}: UserDeleteDialogProps) {
  const t = useTranslations("adminUsers");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteUser = async () => {
    try {
      setIsLoading(true);
      await apiClient.users.remove(user.id);
      toast.success(t("toasts.deleted", { name: user.name || user.email }));
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
      onConfirm={handleDeleteUser}
      title={t("dialogs.deleteTitle", { name: user.name || user.email })}
      description={t("dialogs.deleteDescription")}
      confirmText={
        isLoading
          ? t("dialogs.processing", { defaultValue: "Processing..." })
          : t("dialogs.deleteConfirm")
      }
      confirmVariant="destructive"
    />
  );
}
