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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { NOTIFICATION_TYPES } from "@/shared/constants/notification-types";
import type { UserWithDetailsDTO } from "@/shared/types/user.types";
import type { NotificationDto } from "@/shared/types/notification.types";

interface UserSendInAppNotificationDialogProps {
  user: UserWithDetailsDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function UserSendInAppNotificationDialog({
  user,
  isOpen,
  onClose,
}: UserSendInAppNotificationDialogProps) {
  const t = useTranslations("adminUsers");
  const getInAppNotificationTypeLabel = (value: NotificationDto["type"]) => {
    switch (value) {
      case "subscription":
        return t("dialogs.inAppNotificationTypes.subscription");
      case "system":
        return t("dialogs.inAppNotificationTypes.system");
      case "social":
        return t("dialogs.inAppNotificationTypes.social");
      case "announcement_reference":
        return t("dialogs.inAppNotificationTypes.announcement_reference");
      case "support_ticket":
        return t("dialogs.inAppNotificationTypes.support_ticket");
      case "feedback":
        return t("dialogs.inAppNotificationTypes.feedback");
      default:
        return t("dialogs.inAppNotificationTypes.system");
    }
  };
  const [type, setType] = useState<NotificationDto["type"]>("system");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setType("system");
      setTitle("");
      setMessage("");
      setLink("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const titleTrim = title.trim();
    const messageTrim = message.trim();
    if (!titleTrim || !messageTrim) {
      toast.error(t("dialogs.inAppNotificationValidation"));
      return;
    }

    const linkTrim = link.trim();
    const payload = {
      userId: user.id,
      type,
      title: titleTrim,
      message: messageTrim,
      link: linkTrim.length > 0 ? linkTrim : null,
    };

    try {
      setIsLoading(true);
      await apiClient.adminNotifications.create(payload);
      toast.success(t("toasts.inAppNotificationSent"));
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
            {t("dialogs.inAppNotificationTitle", {
              name: user.name || user.email,
            })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("dialogs.inAppNotificationDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="inapp-type">
              {t("dialogs.inAppNotificationType")}
            </Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as NotificationDto["type"])}
              disabled={isLoading}
            >
              <SelectTrigger id="inapp-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {getInAppNotificationTypeLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inapp-title">
              {t("dialogs.inAppNotificationTitleLabel")}
            </Label>
            <Input
              id="inapp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("dialogs.inAppNotificationTitlePlaceholder")}
              disabled={isLoading}
              maxLength={200}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inapp-message">
              {t("dialogs.inAppNotificationMessageLabel")}
            </Label>
            <Textarea
              id="inapp-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("dialogs.inAppNotificationMessagePlaceholder")}
              disabled={isLoading}
              rows={4}
              maxLength={5000}
              className="resize-none"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="inapp-link">
              {t("dialogs.inAppNotificationLinkLabel")}
            </Label>
            <Input
              id="inapp-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t("dialogs.inAppNotificationLinkPlaceholder")}
              disabled={isLoading}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              {t("dialogs.inAppNotificationLinkHelp")}
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
              ? t("dialogs.inAppNotificationSending")
              : t("dialogs.inAppNotificationConfirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
