"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api/api-client";
import { Label } from "@/components/ui/label";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

interface UserBanDialogProps {
  user: UserWithDetailsDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function UserBanDialog({ user, isOpen, onClose }: UserBanDialogProps) {
  const t = useTranslations("adminUsers");
  const [reason, setReason] = useState("");
  const [banDuration, setBanDuration] = useState("7"); // Default to 7 days
  const [isLoading, setIsLoading] = useState(false);

  const handleBanUser = async () => {
    try {
      setIsLoading(true);
      // Convert duration from days to seconds
      let banExpiresIn: number | undefined;
      if (banDuration === "permanent") {
        banExpiresIn = undefined;
      } else {
        banExpiresIn = parseInt(banDuration) * 24 * 60 * 60; // Days to seconds
      }

      await apiClient.users.ban(user.id, reason, banExpiresIn);
      toast.success(t("toasts.banned", { name: user.name || user.email }));
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
      onConfirm={handleBanUser}
      title={t("dialogs.banTitle", { name: user.name || user.email })}
      description={t("dialogs.banDescription")}
      confirmText={
        isLoading
          ? t("dialogs.processing", { defaultValue: "Processing..." })
          : t("dialogs.banConfirm")
      }
      cancelText={t("dialogs.cancel")}
      confirmVariant="destructive"
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="reason">{t("dialogs.reasonLabel")}</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("dialogs.reasonPlaceholder")}
            className="resize-none"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="banDuration">{t("dialogs.durationLabel")}</Label>
          <Select value={banDuration} onValueChange={setBanDuration}>
            <SelectTrigger id="banDuration" className="w-full">
              <SelectValue placeholder={t("dialogs.durationPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="hover:bg-muted">
                {t("dialogs.duration1")}
              </SelectItem>
              <SelectItem value="3" className="hover:bg-muted">
                {t("dialogs.duration3")}
              </SelectItem>
              <SelectItem value="7" className="hover:bg-muted">
                {t("dialogs.duration7")}
              </SelectItem>
              <SelectItem value="14" className="hover:bg-muted">
                {t("dialogs.duration14")}
              </SelectItem>
              <SelectItem value="30" className="hover:bg-muted">
                {t("dialogs.duration30")}
              </SelectItem>
              <SelectItem value="90" className="hover:bg-muted">
                {t("dialogs.duration90")}
              </SelectItem>
              <SelectItem value="permanent" className="hover:bg-muted">
                {t("dialogs.durationPermanent")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </ConfirmationDialog>
  );
}
