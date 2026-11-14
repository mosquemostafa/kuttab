"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusEnum } from "@/shared/enums/invoice-status.enum";
import type { InvoiceDTO } from "@/shared/types/subscription.types";
import { formatMoney } from "@/lib/format-money";

type SubscriptionInvoicesTableProps = {
  invoices: InvoiceDTO[];
  isLoading: boolean;
  locale: string;
};

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function invoiceStatusBadgeVariant(status: InvoiceDTO["status"]) {
  switch (status) {
    case InvoiceStatusEnum.PAID:
      return "default" as const;
    case InvoiceStatusEnum.PENDING:
      return "secondary" as const;
    case InvoiceStatusEnum.FAILED:
      return "destructive" as const;
    case InvoiceStatusEnum.REFUNDED:
    case InvoiceStatusEnum.PARTIALLY_REFUNDED:
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

export function SubscriptionInvoicesTable({
  invoices,
  isLoading,
  locale,
}: SubscriptionInvoicesTableProps) {
  const t = useTranslations("dashboard");

  const getInvoiceStatusLabel = (status: InvoiceDTO["status"]): string => {
    switch (status) {
      case InvoiceStatusEnum.PAID:
        return t("subscription.statusInvoices.paid");
      case InvoiceStatusEnum.PENDING:
        return t("subscription.statusInvoices.pending");
      case InvoiceStatusEnum.FAILED:
        return t("subscription.statusInvoices.failed");
      case InvoiceStatusEnum.REFUNDED:
        return t("subscription.statusInvoices.refunded");
      case InvoiceStatusEnum.PARTIALLY_REFUNDED:
        return t("subscription.statusInvoices.partially_refunded");
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t("subscription.invoices")}
        </CardTitle>
        <CardDescription>
          {isLoading
            ? t("subscription.loading")
            : t("subscription.invoicesDescription", {
                count: invoices.length,
              })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="h-10 w-full rounded bg-muted/60" />
            <div className="h-10 w-full rounded bg-muted/60" />
            <div className="h-10 w-full rounded bg-muted/60" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("subscription.invoiceEmpty")}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("subscription.invoiceAmount")}</TableHead>
                <TableHead>{t("subscription.invoiceStatus")}</TableHead>
                <TableHead>{t("subscription.invoicePeriod")}</TableHead>
                <TableHead>{t("subscription.invoiceCreatedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    {formatMoney(inv.amount, inv.currency, locale)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invoiceStatusBadgeVariant(inv.status)}>
                      {getInvoiceStatusLabel(inv.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {inv.periodStart || inv.periodEnd
                      ? `${formatDate(inv.periodStart, locale)} - ${formatDate(inv.periodEnd, locale)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(inv.createdAt, locale)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
