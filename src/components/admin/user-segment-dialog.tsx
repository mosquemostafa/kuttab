"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSegmentDialogProps {
  user: UserWithDetailsDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function UserSegmentDialog({
  user,
  isOpen,
  onClose,
}: UserSegmentDialogProps) {
  const t = useTranslations("adminUsers");
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelectedSegmentId(user.segment?.id ?? "none");
  }, [user.segment?.id, isOpen]);

  const { data } = useSWR(isOpen ? ["admin-segments-options"] : null, () =>
    apiClient.segments.list({
      page: 1,
      limit: 100,
    }),
  );

  const segments = useMemo(() => data?.items ?? [], [data]);

  const handleUpdateSegment = async () => {
    try {
      setIsLoading(true);

      const segmentId = selectedSegmentId === "none" ? null : selectedSegmentId;

      await apiClient.users.updateSegment(user.id, segmentId);

      const segmentName =
        segmentId === null
          ? t("statuses.noSegment")
          : (segments.find((item) => item.id === segmentId)?.name ??
            t("statuses.noSegment"));

      toast.success(t("toasts.segmentUpdated", { segment: segmentName }));
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
      onConfirm={handleUpdateSegment}
      title={t("dialogs.updateSegmentTitle", { name: user.name || user.email })}
      description={t("dialogs.updateSegmentDescription")}
      confirmText={
        isLoading
          ? t("dialogs.processing", { defaultValue: "Processing..." })
          : t("dialogs.updateSegmentConfirm")
      }
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="segment">{t("dialogs.segmentLabel")}</Label>
          <Select
            value={selectedSegmentId}
            onValueChange={setSelectedSegmentId}
          >
            <SelectTrigger id="segment" className="w-full">
              <SelectValue placeholder={t("dialogs.segmentPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("statuses.noSegment")}</SelectItem>
              {segments.map((segment) => (
                <SelectItem key={segment.id} value={segment.id}>
                  {segment.icon} {segment.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </ConfirmationDialog>
  );
}
