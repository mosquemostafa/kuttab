"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LifeBuoy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { apiClient } from "@/lib/api/api-client";
import { TicketStatus } from "@/shared/enums/ticket-status.enum";
import type { SupportTicketDTO } from "@/shared/types/support-ticket.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupportTicketChat } from "@/components/support/support-ticket-chat";

interface StaffTicketDetailViewProps {
  initialTicket: SupportTicketDTO;
  currentUserId: string;
  currentUserRole?: string | null;
}

function getBadgeClass(status: TicketStatus): string {
  if (status === TicketStatus.OPEN) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700";
  }

  if (status === TicketStatus.RESOLVED) {
    return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-700";
  }

  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";
}

export function StaffTicketDetailView({
  initialTicket,
  currentUserId,
  currentUserRole,
}: StaffTicketDetailViewProps) {
  const t = useTranslations("dashboard.supportDesk");
  const locale = useLocale();
  const [ticket, setTicket] = useState<SupportTicketDTO>(initialTicket);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return t("statuses.open");
      case TicketStatus.RESOLVED:
        return t("statuses.resolved");
      case TicketStatus.CLOSED:
        return t("statuses.closed");
      default:
        return t("statuses.open");
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      setIsUpdatingStatus(true);
      const updated = await apiClient.supportTickets.updateStatus(ticket.id, {
        status: newStatus,
      });
      setTicket((prev) => ({ ...prev, status: updated.status }));
      toast.success(t("messages.statusUpdated"));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("messages.statusUpdateFailed"),
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/support/tickets">
            <BackIcon className="h-4 w-4" />
            {t("chat.backToTickets")}
          </Link>
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {t("columns.status")}:
          </span>
          <Select
            value={ticket.status}
            onValueChange={(val) => handleStatusChange(val as TicketStatus)}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TicketStatus.OPEN}>
                {t("statuses.open")}
              </SelectItem>
              <SelectItem value={TicketStatus.RESOLVED}>
                {t("statuses.resolved")}
              </SelectItem>
              <SelectItem value={TicketStatus.CLOSED}>
                {t("statuses.closed")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">{ticket.subject}</CardTitle>
              </div>
              <CardDescription>
                {ticket.userEmail ? (
                  <span className="text-primary">{ticket.userEmail}</span>
                ) : (
                  <span>User ID: {ticket.userId}</span>
                )}
                {" • "}
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(ticket.createdAt))}
              </CardDescription>
            </div>

            <Badge variant="outline" className={getBadgeClass(ticket.status)}>
              {getStatusLabel(ticket.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/40 p-4 border text-sm whitespace-pre-wrap text-foreground">
            {ticket.description}
          </div>
        </CardContent>
      </Card>

      <SupportTicketChat
        ticketId={ticket.id}
        ticketStatus={ticket.status}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
