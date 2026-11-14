"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  Gift,
  Percent,
  RefreshCw,
  Tag,
  Search,
  X,
  Copy,
  Check,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type {
  AdminCreateCouponPayload,
  AdminUpdateCouponPayload,
} from "@/lib/api/coupons.api";
import type { CouponDTO } from "@/shared/types/coupon.types";
import { CouponTypeEnum } from "@/shared/enums/coupon-type.enum";
import { CouponDiscountTypeEnum } from "@/shared/enums/coupon-discount-type.enum";
import { InvoiceCurrencyEnum } from "@/shared/enums/invoice-currency.enum";
import { SubscriptionPlanEnum } from "@/shared/enums/subscription-plan.enum";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const LIMIT = 20;

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

type FilterType = CouponTypeEnum | "all";
type FilterActive = "all" | "true" | "false";

export function AdminCouponsPage() {
  const locale = useLocale();
  const t = useTranslations("adminCoupons");
  const [isHydrated, setIsHydrated] = useState(false);

  // Create form state
  const [createType, setCreateType] = useState<CouponTypeEnum>(
    CouponTypeEnum.DISCOUNT,
  );
  const [createCode, setCreateCode] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createUsageLimit, setCreateUsageLimit] = useState("");
  const [createPerUserLimit, setCreatePerUserLimit] = useState("1");
  const [createStartsAt, setCreateStartsAt] = useState("");
  const [createExpiresAt, setCreateExpiresAt] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);

  // Gift fields
  const [createGiftDuration, setCreateGiftDuration] = useState("");

  // Discount fields
  const [createDiscountType, setCreateDiscountType] =
    useState<CouponDiscountTypeEnum>(CouponDiscountTypeEnum.PERCENTAGE);
  const [createDiscountValue, setCreateDiscountValue] = useState("");
  const [createCurrency, setCreateCurrency] = useState<InvoiceCurrencyEnum>(
    InvoiceCurrencyEnum.EGP,
  );
  const [createApplicablePlans, setCreateApplicablePlans] = useState<
    SubscriptionPlanEnum[]
  >([]);

  const [isSaving, setIsSaving] = useState(false);

  // Edit dialog
  const [editingCoupon, setEditingCoupon] = useState<CouponDTO | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editUsageLimit, setEditUsageLimit] = useState("");
  const [editPerUserLimit, setEditPerUserLimit] = useState("1");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  // Edit gift
  const [editGiftDuration, setEditGiftDuration] = useState("");
  // Edit discount
  const [editDiscountType, setEditDiscountType] =
    useState<CouponDiscountTypeEnum>(CouponDiscountTypeEnum.PERCENTAGE);
  const [editDiscountValue, setEditDiscountValue] = useState("");
  const [editCurrency, setEditCurrency] = useState<InvoiceCurrencyEnum>(
    InvoiceCurrencyEnum.EGP,
  );
  const [editApplicablePlans, setEditApplicablePlans] = useState<
    SubscriptionPlanEnum[]
  >([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete dialog
  const [deletingCoupon, setDeletingCoupon] = useState<CouponDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy-to-clipboard state per coupon id
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterActive, setFilterActive] = useState<FilterActive>("all");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Build SWR key with filters
  const swrKey = useMemo(() => {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      limit: LIMIT,
    };

    if (searchQuery.trim()) {
      params.q = searchQuery.trim();
    }

    if (filterType !== "all") {
      params.type = filterType;
    }

    if (filterActive !== "all") {
      params.isActive = filterActive;
    }

    return ["admin-coupons", params] as const;
  }, [page, searchQuery, filterType, filterActive]);

  const { data, isLoading, error, mutate } = useSWR(
    swrKey,
    ([, params]) => apiClient.adminCoupons.list(params),
    {
      revalidateOnFocus: false,
    },
  );

  const items = data?.items ?? [];
  const meta = data?.meta ?? {
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  };
  const totalForDescription = isHydrated ? meta.total : 0;
  // ─── Reset create form ───
  const resetCreateForm = () => {
    setCreateType(CouponTypeEnum.DISCOUNT);
    setCreateCode("");
    setCreateDescription("");
    setCreateUsageLimit("");
    setCreatePerUserLimit("1");
    setCreateStartsAt("");
    setCreateExpiresAt("");
    setCreateIsActive(true);
    setCreateGiftDuration("");
    setCreateDiscountType(CouponDiscountTypeEnum.PERCENTAGE);
    setCreateDiscountValue("");
    setCreateCurrency(InvoiceCurrencyEnum.EGP);
    setCreateApplicablePlans([]);
  };

  // ─── Create form actions ───
  const toggleApplicablePlan = (plan: SubscriptionPlanEnum) => {
    setCreateApplicablePlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan],
    );
  };

  const toggleEditApplicablePlan = (plan: SubscriptionPlanEnum) => {
    setEditApplicablePlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan],
    );
  };

  const buildCreatePayload = (): AdminCreateCouponPayload | null => {
    const base: AdminCreateCouponPayload = {
      type: createType,
      description: createDescription.trim() || null,
      usageLimit: createUsageLimit ? Number(createUsageLimit) : null,
      perUserLimit: Number(createPerUserLimit) || 1,
      startsAt: createStartsAt ? new Date(createStartsAt).toISOString() : null,
      expiresAt: createExpiresAt
        ? new Date(createExpiresAt).toISOString()
        : null,
      isActive: createIsActive,
    };

    if (createCode.trim()) {
      base.code = createCode.trim();
    }

    if (createType === CouponTypeEnum.GIFT) {
      if (!createGiftDuration || Number(createGiftDuration) < 1) {
        toast.error(t("toasts.requiredFields"));
        return null;
      }

      return {
        ...base,
        giftPlan: SubscriptionPlanEnum.PRO,
        giftDuration: Number(createGiftDuration),
      };
    }

    // discount
    if (!createDiscountValue || Number(createDiscountValue) < 1) {
      toast.error(t("toasts.requiredFields"));
      return null;
    }

    return {
      ...base,
      discountType: createDiscountType,
      discountValue: Number(createDiscountValue),
      currency:
        createDiscountType === CouponDiscountTypeEnum.FIXED
          ? createCurrency
          : null,
      applicablePlans:
        createApplicablePlans.length > 0 ? createApplicablePlans : null,
    };
  };

  const onCreate = async () => {
    const payload = buildCreatePayload();
    if (!payload) {
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.adminCoupons.create(payload);
      toast.success(t("toasts.created"));
      resetCreateForm();
      setPage(1);
      mutate();
    } catch (createError) {
      if (createError instanceof Error) {
        toast.error(createError.message);
      } else {
        toast.error(t("toasts.createFailed"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Edit dialog ───
  const openEditModal = (item: CouponDTO) => {
    setEditingCoupon(item);
    setEditDescription(item.description ?? "");
    setEditUsageLimit(item.usageLimit !== null ? String(item.usageLimit) : "");
    setEditPerUserLimit(String(item.perUserLimit));
    setEditStartsAt(toDateTimeLocalValue(item.startsAt));
    setEditExpiresAt(toDateTimeLocalValue(item.expiresAt));
    setEditIsActive(item.isActive);

    if (item.type === CouponTypeEnum.GIFT) {
      setEditGiftDuration(
        item.giftDuration !== null ? String(item.giftDuration) : "",
      );
    } else {
      setEditDiscountType(
        item.discountType ?? CouponDiscountTypeEnum.PERCENTAGE,
      );
      setEditDiscountValue(
        item.discountValue !== null ? String(item.discountValue) : "",
      );
      setEditCurrency(item.currency ?? InvoiceCurrencyEnum.EGP);
      setEditApplicablePlans(item.applicablePlans ?? []);
    }
  };

  const closeEditModal = () => {
    if (isUpdating) {
      return;
    }

    setEditingCoupon(null);
    setEditDescription("");
    setEditUsageLimit("");
    setEditPerUserLimit("1");
    setEditStartsAt("");
    setEditExpiresAt("");
    setEditIsActive(true);
    setEditGiftDuration("");
    setEditDiscountType(CouponDiscountTypeEnum.PERCENTAGE);
    setEditDiscountValue("");
    setEditCurrency(InvoiceCurrencyEnum.EGP);
    setEditApplicablePlans([]);
  };

  const buildUpdatePayload = (): AdminUpdateCouponPayload | null => {
    if (!editingCoupon) {
      return null;
    }

    const payload: AdminUpdateCouponPayload = {};

    if (editDescription !== (editingCoupon.description ?? "")) {
      payload.description = editDescription || null;
    }

    const newUsageLimit = editUsageLimit ? Number(editUsageLimit) : null;
    if (newUsageLimit !== editingCoupon.usageLimit) {
      payload.usageLimit = newUsageLimit;
    }

    const newPerUserLimit = Number(editPerUserLimit) || 1;
    if (newPerUserLimit !== editingCoupon.perUserLimit) {
      payload.perUserLimit = newPerUserLimit;
    }

    const newStartsAt = editStartsAt
      ? new Date(editStartsAt).toISOString()
      : null;
    if (newStartsAt !== editingCoupon.startsAt) {
      payload.startsAt = newStartsAt;
    }

    const newExpiresAt = editExpiresAt
      ? new Date(editExpiresAt).toISOString()
      : null;
    if (newExpiresAt !== editingCoupon.expiresAt) {
      payload.expiresAt = newExpiresAt;
    }

    if (editIsActive !== editingCoupon.isActive) {
      payload.isActive = editIsActive;
    }

    if (editingCoupon.type === CouponTypeEnum.GIFT) {
      const newGiftDuration = editGiftDuration
        ? Number(editGiftDuration)
        : null;
      if (newGiftDuration !== editingCoupon.giftDuration) {
        payload.giftDuration = newGiftDuration ?? undefined;
      }
    } else {
      const newDiscountType =
        editDiscountType !== editingCoupon.discountType
          ? editDiscountType
          : undefined;
      const newDiscountValue = editDiscountValue
        ? Number(editDiscountValue)
        : null;
      const newCurrency =
        editDiscountType === CouponDiscountTypeEnum.FIXED ? editCurrency : null;
      const newApplicablePlans =
        editApplicablePlans.length > 0 ? editApplicablePlans : null;

      if (newDiscountType !== undefined) {
        payload.discountType = newDiscountType;
      }

      const numDiscountValue = newDiscountValue;
      if (numDiscountValue !== editingCoupon.discountValue) {
        payload.discountValue = numDiscountValue ?? undefined;
      }

      if (newCurrency !== editingCoupon.currency) {
        payload.currency = newCurrency;
      }

      if (
        JSON.stringify(newApplicablePlans) !==
        JSON.stringify(editingCoupon.applicablePlans)
      ) {
        payload.applicablePlans = newApplicablePlans ?? undefined;
      }
    }

    // Only send if something changed
    if (Object.keys(payload).length === 0) {
      toast.error(t("toasts.requiredFields"));
      return null;
    }

    return payload;
  };

  const onUpdateCoupon = async () => {
    if (!editingCoupon) {
      return;
    }

    const payload = buildUpdatePayload();
    if (!payload) {
      return;
    }

    try {
      setIsUpdating(true);
      await apiClient.adminCoupons.update(editingCoupon.id, payload);
      toast.success(t("toasts.updated"));
      closeEditModal();
      mutate();
    } catch (updateError) {
      if (updateError instanceof Error) {
        toast.error(updateError.message);
      } else {
        toast.error(t("toasts.updateFailed"));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Delete dialog ───
  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }
    setDeletingCoupon(null);
  };

  const onDeleteCoupon = async () => {
    if (!deletingCoupon) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.adminCoupons.delete(deletingCoupon.id);
      toast.success(t("toasts.deleted"));
      closeDeleteModal();
      mutate();
    } catch (deleteError) {
      if (deleteError instanceof Error) {
        toast.error(deleteError.message);
      } else {
        toast.error(t("toasts.deleteFailed"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Filter helpers ───
  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("all");
    setFilterActive("all");
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || filterType !== "all" || filterActive !== "all";

  // ─── Coupon claim URL ───
  const useClaimUrl = (item: CouponDTO): string => {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

    if (item.type === CouponTypeEnum.GIFT) {
      return `${baseUrl}/${locale}/dashboard/subscription/coupons/redeem/gift?coupon=${item.code}`;
    }

    return `${baseUrl}/${locale}/dashboard/subscription/checkout?coupon=${item.code}`;
  };

  const copyClaimUrlToClipboard = async (item: CouponDTO) => {
    const url = useClaimUrl(item);

    try {
      await navigator.clipboard.writeText(url);
      setCopiedCouponId(item.id);
      setTimeout(() => setCopiedCouponId(null), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  // ─── Render helpers ───
  const formatDate = (iso: string) => {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  };

  const getUsageLabel = (item: CouponDTO) => {
    if (item.usageLimit === null) {
      return t("usage.unlimited", { count: item.usageCount });
    }

    return t("usage.label", { count: item.usageCount, limit: item.usageLimit });
  };

  const getDiscountLabel = (item: CouponDTO) => {
    if (item.discountType === CouponDiscountTypeEnum.PERCENTAGE) {
      return `${item.discountValue}% ${t("badges.percentage")}`;
    }

    if (item.discountType === CouponDiscountTypeEnum.FIXED) {
      return `${item.discountValue} ${item.currency ?? ""} ${t("badges.fixed")}`;
    }

    return "—";
  };

  return (
    <div className="space-y-4">
      {/* ─── Create Card ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t("create.title")}
          </CardTitle>
          <CardDescription>{t("create.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="coupon-code">{t("create.codeLabel")}</Label>
              <Input
                id="coupon-code"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value)}
                placeholder={t("create.codePlaceholder")}
                maxLength={50}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="coupon-type">{t("create.typeLabel")}</Label>
              <Select
                value={createType}
                onValueChange={(value) =>
                  setCreateType(value as CouponTypeEnum)
                }
              >
                <SelectTrigger id="coupon-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CouponTypeEnum.GIFT}>
                    {t("create.giftType")}
                  </SelectItem>
                  <SelectItem value={CouponTypeEnum.DISCOUNT}>
                    {t("create.discountType")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coupon-description">
                {t("create.descriptionLabel")}
              </Label>
              <Input
                id="coupon-description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder={t("create.descriptionPlaceholder")}
                maxLength={1000}
              />
            </div>

            {/* ─── Gift Fields ─── */}
            {createType === CouponTypeEnum.GIFT && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="coupon-gift-plan">
                    {t("create.giftPlanLabel")}
                  </Label>
                  <Input
                    id="coupon-gift-plan"
                    value="Pro"
                    disabled
                    className="text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("create.giftPlanHint")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-gift-duration">
                    {t("create.giftDurationLabel")}
                  </Label>
                  <Input
                    id="coupon-gift-duration"
                    type="number"
                    min={1}
                    value={createGiftDuration}
                    onChange={(e) => setCreateGiftDuration(e.target.value)}
                    placeholder={t("create.giftDurationPlaceholder")}
                  />
                </div>
              </>
            )}

            {/* ─── Discount Fields ─── */}
            {createType === CouponTypeEnum.DISCOUNT && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="coupon-discount-type">
                    {t("create.discountTypeLabel")}
                  </Label>
                  <Select
                    value={createDiscountType}
                    onValueChange={(value) =>
                      setCreateDiscountType(value as CouponDiscountTypeEnum)
                    }
                  >
                    <SelectTrigger id="coupon-discount-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CouponDiscountTypeEnum.PERCENTAGE}>
                        {t("create.percentage")}
                      </SelectItem>
                      <SelectItem value={CouponDiscountTypeEnum.FIXED}>
                        {t("create.fixed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coupon-discount-value">
                    {t("create.discountValueLabel")}
                  </Label>
                  <Input
                    id="coupon-discount-value"
                    type="number"
                    min={1}
                    max={
                      createDiscountType === CouponDiscountTypeEnum.PERCENTAGE
                        ? 100
                        : undefined
                    }
                    value={createDiscountValue}
                    onChange={(e) => setCreateDiscountValue(e.target.value)}
                    placeholder={t("create.discountValuePlaceholder")}
                  />
                  {createDiscountType === CouponDiscountTypeEnum.PERCENTAGE && (
                    <p className="text-xs text-muted-foreground">
                      {t("badges.percentage")}
                    </p>
                  )}
                </div>

                {createDiscountType === CouponDiscountTypeEnum.FIXED && (
                  <div className="space-y-2">
                    <Label htmlFor="coupon-currency">
                      {t("create.currencyLabel")}
                    </Label>
                    <Select
                      value={createCurrency}
                      onValueChange={(value) =>
                        setCreateCurrency(value as InvoiceCurrencyEnum)
                      }
                    >
                      <SelectTrigger id="coupon-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={InvoiceCurrencyEnum.EGP}>
                          {t("create.EGP")}
                        </SelectItem>
                        <SelectItem value={InvoiceCurrencyEnum.USD}>
                          {t("create.USD")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {t("create.currencyRequired")}
                    </p>
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label>{t("create.applicablePlansLabel")}</Label>
                  <div className="flex flex-wrap gap-4">
                    {(
                      [
                        SubscriptionPlanEnum.FREE,
                        SubscriptionPlanEnum.TRIAL,
                        SubscriptionPlanEnum.PRO,
                      ] as const
                    ).map((plan) => (
                      <label
                        key={plan}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={createApplicablePlans.includes(plan)}
                          onChange={() => toggleApplicablePlan(plan)}
                        />
                        {plan === SubscriptionPlanEnum.FREE
                          ? t("create.free")
                          : plan === SubscriptionPlanEnum.TRIAL
                            ? t("create.trial")
                            : t("create.pro")}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ─── Usage ─── */}
            <div className="space-y-2">
              <Label htmlFor="coupon-usage-limit">
                {t("create.usageLimitLabel")}
              </Label>
              <Input
                id="coupon-usage-limit"
                type="number"
                min={1}
                value={createUsageLimit}
                onChange={(e) => setCreateUsageLimit(e.target.value)}
                placeholder={t("create.usageLimitPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-per-user-limit">
                {t("create.perUserLimitLabel")}
              </Label>
              <Input
                id="coupon-per-user-limit"
                type="number"
                min={1}
                value={createPerUserLimit}
                onChange={(e) => setCreatePerUserLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("create.perUserLimitHint")}
              </p>
            </div>

            {/* ─── Dates ─── */}
            <div className="space-y-2">
              <Label htmlFor="coupon-starts-at">
                {t("create.startsAtLabel")}
              </Label>
              <Input
                id="coupon-starts-at"
                type="datetime-local"
                value={createStartsAt}
                onChange={(e) => setCreateStartsAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-expires-at">
                {t("create.expiresAtLabel")}
              </Label>
              <Input
                id="coupon-expires-at"
                type="datetime-local"
                value={createExpiresAt}
                onChange={(e) => setCreateExpiresAt(e.target.value)}
              />
            </div>

            {/* ─── Active toggle ─── */}
            <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
              <div>
                <p className="text-sm font-medium">
                  {t("create.isActiveLabel")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("create.isActiveHint")}
                </p>
              </div>
              <Switch
                checked={createIsActive}
                onCheckedChange={setCreateIsActive}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={onCreate} disabled={isSaving}>
              {isSaving ? t("create.saving") : t("create.submit")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── List Card ─── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle>{t("list.title")}</CardTitle>
            <CardDescription>
              {t("list.description", { total: totalForDescription })}
            </CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4" />
            {t("list.refresh")}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ─── Filters ─── */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-50 max-w-xs">
              <Search className="absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={t("list.searchPlaceholder")}
              />
            </div>

            <Select
              value={filterType}
              onValueChange={(value) => {
                setFilterType(value as FilterType);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-35">
                <SelectValue placeholder={t("list.filterType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("list.filterTypeAll")}</SelectItem>
                <SelectItem value={CouponTypeEnum.GIFT}>
                  {t("create.giftType")}
                </SelectItem>
                <SelectItem value={CouponTypeEnum.DISCOUNT}>
                  {t("create.discountType")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filterActive}
              onValueChange={(value) => {
                setFilterActive(value as FilterActive);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-35">
                <SelectValue placeholder={t("list.filterActive")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("list.filterActiveAll")}</SelectItem>
                <SelectItem value="true">
                  {t("list.filterActiveActive")}
                </SelectItem>
                <SelectItem value="false">
                  {t("list.filterActiveInactive")}
                </SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                <X className="h-4 w-4 me-1" />
                {t("list.filterReset")}
              </Button>
            )}
          </div>

          {/* ─── Table ─── */}
          {!isHydrated || isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{t("list.loadFailed")}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.code")}</TableHead>
                    <TableHead>{t("columns.type")}</TableHead>
                    <TableHead>
                      {createType === CouponTypeEnum.GIFT
                        ? t("columns.gift")
                        : t("columns.discount")}
                    </TableHead>
                    <TableHead>{t("columns.usage")}</TableHead>
                    <TableHead>{t("columns.active")}</TableHead>
                    <TableHead>{t("columns.createdAt")}</TableHead>
                    <TableHead className="text-end">
                      {t("columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{item.code}</span>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => copyClaimUrlToClipboard(item)}
                            title={
                              copiedCouponId === item.id
                                ? (t("toasts.copied") ?? "Copied!")
                                : "Copy claim link"
                            }
                          >
                            {copiedCouponId === item.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.type === CouponTypeEnum.GIFT ? (
                          <Badge variant="secondary" className="gap-1">
                            <Gift className="h-3 w-3" />
                            {t("badges.gift")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <Percent className="h-3 w-3" />
                            {t("badges.discount")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.type === CouponTypeEnum.GIFT
                          ? `${item.giftDuration ?? "—"} days`
                          : getDiscountLabel(item)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {getUsageLabel(item)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "default" : "outline"}>
                          {item.isActive
                            ? t("badges.active")
                            : t("badges.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(item)}
                          >
                            {t("edit.title")}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingCoupon(item)}
                          >
                            {t("delete.title")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ─── Pagination ─── */}
          {meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                      aria-disabled={meta.page === 1}
                      tabIndex={meta.page === 1 ? -1 : 0}
                      className={
                        meta.page === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: meta.totalPages }).map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          isActive={meta.page === pageNumber}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setPage((value) => Math.min(meta.totalPages, value + 1))
                      }
                      aria-disabled={meta.page === meta.totalPages}
                      tabIndex={meta.page === meta.totalPages ? -1 : 0}
                      className={
                        meta.page === meta.totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Edit Dialog ─── */}
      <AlertDialog
        open={Boolean(editingCoupon)}
        onOpenChange={(open) => {
          if (!open) {
            closeEditModal();
          }
        }}
      >
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("edit.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("edit.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4">
            {/* Code (read-only) */}
            <div className="flex flex-col gap-2">
              <Label>{t("columns.code")}</Label>
              <Input
                value={editingCoupon?.code ?? ""}
                disabled
                className="text-muted-foreground font-mono text-xs"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-coupon-description">
                  {t("edit.descriptionLabel")}
                </Label>
                <Input
                  id="edit-coupon-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              {editingCoupon?.type === CouponTypeEnum.GIFT && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-coupon-gift-duration">
                    {t("edit.giftDurationLabel")}
                  </Label>
                  <Input
                    id="edit-coupon-gift-duration"
                    type="number"
                    min={1}
                    value={editGiftDuration}
                    onChange={(e) => setEditGiftDuration(e.target.value)}
                  />
                </div>
              )}
            </div>

            {editingCoupon?.type === CouponTypeEnum.DISCOUNT && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-coupon-discount-type">
                    {t("edit.discountTypeLabel")}
                  </Label>
                  <Select
                    value={editDiscountType}
                    onValueChange={(value) =>
                      setEditDiscountType(value as CouponDiscountTypeEnum)
                    }
                  >
                    <SelectTrigger id="edit-coupon-discount-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CouponDiscountTypeEnum.PERCENTAGE}>
                        {t("create.percentage")}
                      </SelectItem>
                      <SelectItem value={CouponDiscountTypeEnum.FIXED}>
                        {t("create.fixed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-coupon-discount-value">
                    {t("edit.discountValueLabel")}
                  </Label>
                  <Input
                    id="edit-coupon-discount-value"
                    type="number"
                    min={1}
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(e.target.value)}
                  />
                </div>

                {editDiscountType === CouponDiscountTypeEnum.FIXED && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="edit-coupon-currency">
                      {t("edit.currencyLabel")}
                    </Label>
                    <Select
                      value={editCurrency}
                      onValueChange={(value) =>
                        setEditCurrency(value as InvoiceCurrencyEnum)
                      }
                    >
                      <SelectTrigger id="edit-coupon-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={InvoiceCurrencyEnum.EGP}>
                          {t("create.EGP")}
                        </SelectItem>
                        <SelectItem value={InvoiceCurrencyEnum.USD}>
                          {t("create.USD")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label>{t("edit.applicablePlansLabel")}</Label>
                  <div className="flex flex-wrap gap-4">
                    {(
                      [
                        SubscriptionPlanEnum.FREE,
                        SubscriptionPlanEnum.TRIAL,
                        SubscriptionPlanEnum.PRO,
                      ] as const
                    ).map((plan) => (
                      <label
                        key={plan}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-primary"
                          checked={editApplicablePlans.includes(plan)}
                          onChange={() => toggleEditApplicablePlan(plan)}
                        />
                        {plan === SubscriptionPlanEnum.FREE
                          ? t("create.free")
                          : plan === SubscriptionPlanEnum.TRIAL
                            ? t("create.trial")
                            : t("create.pro")}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-coupon-usage-limit">
                  {t("edit.usageLimitLabel")}
                </Label>
                <Input
                  id="edit-coupon-usage-limit"
                  type="number"
                  min={1}
                  value={editUsageLimit}
                  onChange={(e) => setEditUsageLimit(e.target.value)}
                  placeholder={t("edit.usageLimitPlaceholder")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-coupon-per-user-limit">
                  {t("edit.perUserLimitLabel")}
                </Label>
                <Input
                  id="edit-coupon-per-user-limit"
                  type="number"
                  min={1}
                  value={editPerUserLimit}
                  onChange={(e) => setEditPerUserLimit(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-coupon-starts-at">
                  {t("edit.startsAtLabel")}
                </Label>
                <Input
                  id="edit-coupon-starts-at"
                  type="datetime-local"
                  value={editStartsAt}
                  onChange={(e) => setEditStartsAt(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-coupon-expires-at">
                  {t("edit.expiresAtLabel")}
                </Label>
                <Input
                  id="edit-coupon-expires-at"
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                <div>
                  <p className="text-sm font-medium">
                    {t("edit.isActiveLabel")}
                  </p>
                </div>
                <Switch
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                />
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>
              {t("edit.cancel")}
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={onUpdateCoupon}
              disabled={isUpdating}
            >
              {isUpdating ? t("edit.saving") : t("edit.save")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Dialog ─── */}
      <AlertDialog
        open={Boolean(deletingCoupon)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteModal();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.description", {
                code: deletingCoupon?.code ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("delete.cancel")}
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteCoupon}
              disabled={isDeleting}
            >
              {isDeleting ? t("delete.deleting") : t("delete.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
