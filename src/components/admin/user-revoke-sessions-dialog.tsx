"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api/api-client";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useTranslations } from "next-intl";

interface UserRevokeSessionsDialogProps {
  user: UserWithDetailsDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function UserRevokeSessionsDialog({
  user,
  isOpen,
  onClose,
}: UserRevokeSessionsDialogProps) {
  const t = useTranslations("adminUsers");
  const [isLoading, setIsLoading] = useState(false);

  const handleRevokeSessions = async () => {
    try {
      setIsLoading(true);
      await apiClient.users.revokeSessions(user.id);
      toast.success(
        t("toasts.revokedSessions", { name: user.name || user.email }),
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
      onConfirm={handleRevokeSessions}
      title={t("dialogs.revokeTitle", { name: user.name || user.email })}
      description={t("dialogs.revokeDescription")}
      confirmText={
        isLoading
          ? t("dialogs.processing", { defaultValue: "Processing..." })
          : t("dialogs.revokeConfirm")
      }
      confirmVariant="destructive"
    />
  );
}
