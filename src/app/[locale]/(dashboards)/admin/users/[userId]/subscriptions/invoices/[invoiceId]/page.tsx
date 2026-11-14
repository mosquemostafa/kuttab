"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { apiClient } from "@/lib/api/api-client";
import type { InvoiceDTO } from "@/shared/types/subscription.types";

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

export default function AdminInvoiceByIdPage() {
  const t = useTranslations("adminUsers");
  const locale = useLocale();
  const params = useParams<{ invoiceId?: string }>();
  const invoiceId = useMemo(() => params?.invoiceId ?? "", [params?.invoiceId]);

  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!invoiceId) {
        setInvoice(null);
        setLoadFailed(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadFailed(false);

      try {
        const data =
          await apiClient.adminSubscriptions.getInvoiceById(invoiceId);
        if (!cancelled) {
          setInvoice(data);
        }
      } catch {
        if (!cancelled) {
          setInvoice(null);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="rounded-lg border bg-card p-4">
        <h1 className="mb-3 text-xl font-semibold">
          {t("subscriptionInvoices.title")}
        </h1>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            {t("subscriptionInvoices.loading")}
          </p>
        ) : loadFailed || !invoice ? (
          <p className="text-sm text-muted-foreground">
            {t("subscriptionInvoices.loadFailed")}
          </p>
        ) : (
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("subscriptionInvoices.invoiceId")}
              </p>
              <p className="break-all font-mono text-xs">{invoice.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("subscriptionInvoices.amount")}
              </p>
              <p>
                {invoice.amount} {invoice.currency}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p>{invoice.status}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("subscriptionInvoices.paymentMethod")}
              </p>
              <p>{invoice.paymentMethod}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("subscriptionInvoices.gateway")}
              </p>
              <p>{invoice.gateway ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("subscriptionInvoices.paymentReference")}
              </p>
              <p className="break-all font-mono text-xs">
                {invoice.paymentReference ?? "—"}
              </p>
            </div>
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
            <div>
              <p className="text-xs text-muted-foreground">
                {t("subscriptionInvoices.paidAt")}
              </p>
              <p>{formatDate(invoice.paidAt, locale)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("subscriptionInvoices.refundedAmount")}
              </p>
              <p>
                {invoice.refundedAmount ?? 0} {invoice.currency}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="text-xs text-muted-foreground">
                {t("subscriptionInvoices.refundReason")}
              </p>
              <p>{invoice.refundReason ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p>{formatDate(invoice.createdAt, locale)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
