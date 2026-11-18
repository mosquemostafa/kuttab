"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RelationSelect } from "@/components/ui/relation-select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/api-client";
import type { SelectUserItem } from "@/shared/types/select.types";

interface StaffCreateTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  onSuccess?: (ticketId: string) => void;
}

export function StaffCreateTicketDialog({
  isOpen,
  onClose,
  targetUser,
  onSuccess,
}: StaffCreateTicketDialogProps) {
  const t = useTranslations("dashboard.supportDesk.initiateDialog");
  const router = useRouter();

  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name?: string | null;
    email?: string | null;
  } | null>(targetUser ?? null);

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogContainer, setDialogContainer] = useState<HTMLDivElement | null>(
    null,
  );

  useEffect(() => {
    if (targetUser) {
      setSelectedUser(targetUser);
    } else {
      setSelectedUser(null);
    }
  }, [targetUser, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSubject("");
      setDescription("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser?.id) {
      toast.error(t("selectUserRequired"));
      return;
    }

    const trimmedSubject = subject.trim();
    const trimmedDescription = description.trim();

    if (!trimmedSubject) {
      toast.error(t("subjectRequired"));
      return;
    }

    if (!trimmedDescription) {
      toast.error(t("messageRequired"));
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await apiClient.supportTickets.createByStaff({
        targetUserId: selectedUser.id,
        subject: trimmedSubject,
        description: trimmedDescription,
      });

      toast.success(t("successToast"));
      onClose();

      if (onSuccess) {
        onSuccess(created.id);
      } else {
        router.push(`/support/tickets/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedToast"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent ref={setDialogContainer} className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Target User selection */}
          <div className="space-y-2">
            <Label htmlFor="support-ticket-user">{t("userLabel")}</Label>
            {targetUser || selectedUser ? (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 text-sm">
                <div>
                  <div className="font-medium">
                    {selectedUser?.name ||
                      selectedUser?.email ||
                      t("unknownUser")}
                  </div>
                  {selectedUser?.email && selectedUser.name && (
                    <div className="text-xs text-muted-foreground">
                      {selectedUser.email}
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground/70 font-mono">
                    ID: {selectedUser?.id}
                  </div>
                </div>
                {!targetUser && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedUser(null)}
                  >
                    {t("changeUser")}
                  </Button>
                )}
              </div>
            ) : (
              <RelationSelect<SelectUserItem>
                endpoint="/users/select"
                value=""
                onValueChange={(_userId, user) => {
                  if (!user) return;
                  setSelectedUser({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                  });
                }}
                placeholder={t("searchPlaceholder")}
                id="support-ticket-user"
                enabled={isOpen}
                disabled={isSubmitting}
                container={dialogContainer}
                renderOption={(user) => (
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {user.name || user.email || t("unknownUser")}
                    </span>
                    {user.email && user.name ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    ) : null}
                  </span>
                )}
              />
            )}
          </div>

          {/* Ticket Subject */}
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">{t("subjectLabel")}</Label>
            <Input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("subjectPlaceholder")}
              maxLength={200}
              required
            />
          </div>

          {/* Initial Message / Description */}
          <div className="space-y-2">
            <Label htmlFor="ticket-description">{t("messageLabel")}</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={4}
              maxLength={20000}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedUser ||
                !subject.trim() ||
                !description.trim()
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
