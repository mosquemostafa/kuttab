"use client";

import { useState } from "react";
import { UserX } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations, useLocale } from "next-intl";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { apiClient } from "@/lib/api/api-client";
import { authClient } from "@/lib/auth-client";

export default function DeleteAccountCard() {
  const t = useTranslations("settings.deleteAccount");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.user.deleteMyAccount();
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/";
          },
        },
      });
      toast.success(t("messages.success"));
    } catch {
      toast.error(t("messages.error"));
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 gap-4">
          <div
            className="hidden size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary sm:flex"
            aria-hidden
          >
            <UserX className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => setIsDialogOpen(true)}
          disabled={isSubmitting}
        >
          {isSubmitting ? t("deleting") : t("button")}
        </Button>
      </CardContent>

      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
        title={t("dialog.title")}
        description={t("dialog.description")}
        confirmText={t("dialog.confirm")}
        cancelText={t("dialog.cancel")}
        confirmVariant="destructive"
        dir={dir}
      />
    </Card>
  );
}
