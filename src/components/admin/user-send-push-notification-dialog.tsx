"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";

interface UserSendPushNotificationDialogProps {
  user: UserWithDetailsDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function UserSendPushNotificationDialog({
  user,
  isOpen,
  onClose,
}: UserSendPushNotificationDialogProps) {
  const t = useTranslations("adminUsers");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setBody("");
    setUrl("");
    setImageUrl("");
    setIsLoading(false);
  }, [isOpen]);

  const handleSend = async () => {
    const titleTrim = title.trim();
    const bodyTrim = body.trim();

    if (!titleTrim || !bodyTrim) {
      toast.error(t("dialogs.sendPushValidation"));
      return;
    }

    try {
      setIsLoading(true);
      const result = await apiClient.adminFcm.sendToUser({
        userId: user.id,
        title: titleTrim,
        body: bodyTrim,
        url: url.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
      });
      if (result.failureCount > 0 && result.successCount === 0) {
        const firstError =
          result.failures[0]?.message ?? t("errors.unknownSendError");
        toast.error(firstError);
        return;
      }
      toast.success(
        t("toasts.pushSentToToken", {
          successCount: result.successCount,
          targetedTokens: result.targetedTokens,
        }),
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
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <AlertDialogContent
        size="default"
        className={cn(
          "w-[calc(100%-2rem)] sm:max-w-lg",
          "gap-4 sm:group-data-[size=default]/alert-dialog-content:text-start",
        )}
      >
        <AlertDialogHeader className="text-start">
          <AlertDialogTitle>
            {t("dialogs.sendPushTitle", { name: user.name || user.email })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("dialogs.sendPushDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="push-title">
              {t("dialogs.sendPushTitleLabel")}
            </Label>
            <Input
              id="push-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("dialogs.sendPushTitlePlaceholder")}
              disabled={isLoading}
              maxLength={200}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="push-body">{t("dialogs.sendPushBodyLabel")}</Label>
            <Textarea
              id="push-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("dialogs.sendPushBodyPlaceholder")}
              disabled={isLoading}
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="push-url">{t("dialogs.sendPushUrlLabel")}</Label>
            <Input
              id="push-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("dialogs.sendPushUrlPlaceholder")}
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {t("dialogs.sendPushUrlHelp")}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="push-image-url">
              {t("dialogs.sendPushImageUrlLabel")}
            </Label>
            <Input
              id="push-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t("dialogs.sendPushImageUrlPlaceholder")}
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {t("dialogs.sendPushImageUrlHelp")}
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t("dialogs.cancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={isLoading}
          >
            {isLoading
              ? t("dialogs.sendPushSending")
              : t("dialogs.sendPushConfirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
