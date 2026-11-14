"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  SendHorizonal,
  Trash2,
  ShieldCheck,
  User as UserIcon,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import { TicketStatus } from "@/shared/enums/ticket-status.enum";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { SupportTicketMessageDTO } from "@/shared/types/support-ticket.types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface SupportTicketChatProps {
  ticketId: string;
  ticketStatus: TicketStatus;
  currentUserId: string;
  currentUserRole?: UserRole | string | null;
  onTicketReopened?: () => void;
}

export function SupportTicketChat({
  ticketId,
  ticketStatus,
  currentUserId,
  currentUserRole,
  onTicketReopened,
}: SupportTicketChatProps) {
  const t = useTranslations("dashboard.support.chat");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDeleteMessage, setPendingDeleteMessage] =
    useState<SupportTicketMessageDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isStaff =
    currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.SUPPORT;

  const {
    data: messages = [],
    isLoading,
    error,
    mutate,
  } = useSWR(
    ticketId ? ["support-ticket-messages", ticketId] : null,
    () => apiClient.supportTickets.listMessages(ticketId),
    {
      refreshInterval: 6000,
      revalidateOnFocus: true,
    },
  );

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const wasClosed = ticketStatus !== TicketStatus.OPEN;

      await apiClient.supportTickets.sendMessage(ticketId, {
        content: trimmed,
      });

      setContent("");
      toast.success(t("messageSent"));
      await mutate();
      scrollToBottom();

      if (!isStaff && wasClosed && onTicketReopened) {
        onTicketReopened();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!pendingDeleteMessage) return;

    try {
      setIsDeleting(true);
      await apiClient.supportTickets.deleteMessage(
        ticketId,
        pendingDeleteMessage.id,
      );
      toast.success(t("messageDeleted"));
      setPendingDeleteMessage(null);
      await mutate();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete message";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-[520px] rounded-lg border bg-card">
      <div className="border-b px-4 py-3 bg-muted/30 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {t("title")}
        </h3>
        {ticketStatus !== TicketStatus.OPEN && !isStaff && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{t("ticketClosedNotice")}</span>
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-12 w-64 rounded-lg" />
              </div>
            </div>
            <div className="flex items-start gap-3 justify-end">
              <div className="space-y-1 items-end flex flex-col">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-14 w-72 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-sm text-destructive py-8">
            Failed to load messages.
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            {t("noMessages")}
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === currentUserId;
            const isSenderStaff =
              message.senderRole === UserRole.ADMIN ||
              message.senderRole === UserRole.SUPPORT;

            // Staff can delete their own messages (or Admin can delete)
            const canDelete =
              isStaff &&
              (message.senderId === currentUserId ||
                currentUserRole === UserRole.ADMIN);

            return (
              <div
                key={message.id}
                className={`flex items-start gap-2.5 group ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  <Avatar className="h-8 w-8 shrink-0">
                    {message.senderAvatar && (
                      <AvatarImage
                        src={message.senderAvatar}
                        alt={message.senderName ?? ""}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {isSenderStaff ? (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`flex flex-col max-w-[80%] md:max-w-[70%] ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-medium">
                      {isMe
                        ? t("you")
                        : isSenderStaff
                          ? (message.senderName ?? t("supportStaff"))
                          : (message.senderName ?? t("customer"))}
                    </span>
                    {isSenderStaff && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5 py-0 font-normal"
                      >
                        {t("supportStaff")}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(message.createdAt), "MMM d, h:mm a")}
                    </span>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteMessage(message)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5 rounded"
                        title={t("deleteMessage")}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span className="sr-only">{t("deleteMessage")}</span>
                      </button>
                    )}
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words leading-relaxed ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                        : isSenderStaff
                          ? "bg-muted border border-border/60 text-foreground rounded-tl-xs"
                          : "bg-accent/40 text-foreground rounded-tl-xs"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {isMe && (
                  <Avatar className="h-8 w-8 shrink-0">
                    {message.senderAvatar && (
                      <AvatarImage
                        src={message.senderAvatar}
                        alt={message.senderName ?? ""}
                      />
                    )}
                    <AvatarFallback className="text-xs">
                      {isSenderStaff ? (
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSendMessage}
        className="border-t p-3 bg-muted/20 flex gap-2 items-end"
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("inputPlaceholder")}
          rows={2}
          maxLength={10000}
          className="resize-none min-h-[50px] max-h-[120px] text-sm"
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isSubmitting || !content.trim()}
          className="shrink-0 h-10 w-10"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isSubmitting ? t("sending") : t("send")}
          </span>
        </Button>
      </form>

      <ConfirmationDialog
        isOpen={Boolean(pendingDeleteMessage)}
        title={t("deleteMessage")}
        description={t("deleteMessageConfirm")}
        confirmText={isDeleting ? t("deleting") : t("delete")}
        cancelText={t("cancel")}
        confirmVariant="destructive"
        onConfirm={handleDeleteMessage}
        onClose={() => setPendingDeleteMessage(null)}
      />
    </div>
  );
}
