"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api/api-client";
import type {
  InvoiceDTO,
  SubscriptionDTO,
} from "@/shared/types/subscription.types";

type AdminUserSubscriptionInvoicesProps = {
  userId: string;
};

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function AdminUserSubscriptionInvoices({
  userId,
}: AdminUserSubscriptionInvoicesProps) {
  const t = useTranslations("adminUsers");
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionDTO | null>(
    null,
  );
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [activeRefundInvoiceId, setActiveRefundInvoiceId] = useState<
    string | null
  >(null);
  const [refundAmount, setRefundAmount] = useState("1");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [revokeAccess, setRevokeAccess] = useState(false);
  const [refundSubmittingId, setRefundSubmittingId] = useState<string | null>(
    null,
  );
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccessId, setRefundSuccessId] = useState<string | null>(null);
  const activeRefundInvoice = invoices.find(
    (invoice) => invoice.id === activeRefundInvoiceId,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadFailed(false);

      try {
        const sub = await apiClient.adminSubscriptions.getByUserId(userId);
        if (cancelled) return;

        setSubscription(sub);

        if (!sub) {
          setInvoices([]);
          return;
        }

        const list = await apiClient.adminSubscriptions.listInvoices(sub.id);
        if (!cancelled) {
          setInvoices(list);
        }
      } catch {
        if (!cancelled) {
          setLoadFailed(true);
          setInvoices([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function openRefundForm(invoice: InvoiceDTO) {
    const remainingRefundable = Math.max(
      1,
      invoice.amount - (invoice.refundedAmount ?? 0),
    );
    setActiveRefundInvoiceId(invoice.id);
    setRefundAmount(String(remainingRefundable));
    setRefundReason("");
    setRefundNotes("");
    setRevokeAccess(false);
    setRefundError(null);
    setRefundSuccessId(null);
  }

  async function submitRefund(invoice: InvoiceDTO) {
    const parsedAmount = Number.parseInt(refundAmount, 10);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setRefundError(t("subscriptionInvoices.refundValidationAmount"));
      return;
    }

    if (refundReason.trim().length === 0) {
      setRefundError(t("subscriptionInvoices.refundValidationReason"));
      return;
    }

    setRefundSubmittingId(invoice.id);
    setRefundError(null);
    setRefundSuccessId(null);

    try {
      const result = await apiClient.adminSubscriptions.refundInvoice(
        invoice.id,
        {
          refundedAmount: parsedAmount,
          reason: refundReason.trim(),
          notes: refundNotes.trim() || undefined,
          revokeAccess,
        },
      );

      setInvoices((prev) =>
        prev.map((item) =>
          item.id === invoice.id
            ? {
                ...item,
                status: result.invoiceStatus as InvoiceDTO["status"],
                refundedAmount: result.refundedAmount,
                refundReason: result.refundReason,
              }
            : item,
        ),
      );

      setRefundSuccessId(invoice.id);
      setActiveRefundInvoiceId(null);
    } catch (error) {
      if (error instanceof Error) {
        setRefundError(error.message);
      } else {
        setRefundError(t("subscriptionInvoices.refundFailed"));
      }
    } finally {
      setRefundSubmittingId(null);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-base font-semibold">
        {t("subscriptionInvoices.title")}
      </h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionInvoices.loading")}
        </p>
      ) : loadFailed ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionInvoices.loadFailed")}
        </p>
      ) : !subscription ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionInvoices.noSubscription")}
        </p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("subscriptionInvoices.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">
                  {invoice.amount} {invoice.currency}
                </p>
                <div className="ms-auto flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(invoice.createdAt, locale)}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={t("actions.menuLabel")}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/${locale}/admin/users/${userId}/subscriptions/invoices/${invoice.id}`}
                        >
                          {t("subscriptionInvoices.viewDetails")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRefundForm(invoice)}>
                        {t("subscriptionInvoices.refundAction")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("subscriptionInvoices.periodStart")}
                  </p>
                  <p>{formatDate(invoice.periodStart, locale)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("subscriptionInvoices.periodEnd")}
                  </p>
                  <p>{formatDate(invoice.periodEnd, locale)}</p>
                </div>
              </div>

              {refundSuccessId === invoice.id ? (
                <p className="mt-3 text-sm text-emerald-600">
                  {t("subscriptionInvoices.refundSuccess")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(activeRefundInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveRefundInvoiceId(null);
            setRefundError(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {activeRefundInvoice ? (
            <>
              <DialogHeader className="text-start">
                <DialogTitle>
                  {t("subscriptionInvoices.refundAction")}
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t("subscriptionInvoices.refundAmount")}
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t("subscriptionInvoices.refundReasonInput")}
                    </label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      maxLength={1000}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {t("subscriptionInvoices.refundNotes")}
                  </label>
                  <textarea
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    className="min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
                    maxLength={1000}
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={revokeAccess}
                    onChange={(e) => setRevokeAccess(e.target.checked)}
                  />
                  <span>{t("subscriptionInvoices.revokeAccess")}</span>
                </label>

                {refundError ? (
                  <p className="text-sm text-destructive">{refundError}</p>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => submitRefund(activeRefundInvoice)}
                    className="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={refundSubmittingId === activeRefundInvoice.id}
                  >
                    {refundSubmittingId === activeRefundInvoice.id
                      ? t("subscriptionInvoices.refundSubmitting")
                      : t("subscriptionInvoices.refundSubmit")}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
