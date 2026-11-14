"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { Link, useRouter } from "@/i18n/navigation";
import {
  isApiClientError,
  validationDetailsToFieldErrors,
} from "@/lib/api/api-error";
import { apiClient } from "@/lib/api/api-client";
import { isRichTextEmpty } from "@/lib/rich-text-empty";
import {
  NEWSLETTER_BODY_MAX_CHARS,
  NEWSLETTER_EXCERPT_MAX_CHARS,
  NEWSLETTER_SLUG_MAX_CHARS,
  NEWSLETTER_SUBJECT_MAX_CHARS,
} from "@/shared/constants/newsletter";
import type { NewsletterCampaignDetailDTO } from "@/shared/types/newsletter.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  SimpleEditor,
  clearDraft,
} from "@/components/tiptap-templates/simple/simple-editor";
import { RichTextDisplay } from "@/components/ui/rich-text-display";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type NewsletterCampaignFormMode = "create" | "edit" | "view";

type NewsletterCampaignFormProps = {
  mode: NewsletterCampaignFormMode;
  /** Required when mode is `edit` or `view`. */
  campaignId?: string;
  deliveryEnabled: boolean;
  /** When the parent already fetched the campaign (detail page). */
  initialDetail?: NewsletterCampaignDetailDTO | null;
};

export function NewsletterCampaignForm({
  mode,
  campaignId,
  deliveryEnabled,
  initialDetail,
}: NewsletterCampaignFormProps) {
  const t = useTranslations("contentNewsletter");
  const router = useRouter();

  const swrKey =
    campaignId && mode !== "create"
      ? (["content-newsletter-campaign", campaignId] as const)
      : null;

  const {
    data: detail,
    mutate: mutateDetail,
    isLoading: detailLoading,
  } = useSWR(swrKey, ([, id]) => apiClient.contentNewsletter.getCampaign(id), {
    fallbackData: initialDetail ?? undefined,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });

  const [subjectAr, setSubjectAr] = useState("");
  const [subjectEn, setSubjectEn] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isWebsitePublic, setIsWebsitePublic] = useState(false);
  const [slug, setSlug] = useState("");
  const [excerptAr, setExcerptAr] = useState("");
  const [excerptEn, setExcerptEn] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string>
  >({});

  const clearServerError = useCallback((field: string) => {
    setServerFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const serverFieldLabel = useCallback(
    (key: string) => {
      const labels: Record<string, string> = {
        subjectAr: t("campaigns.subjectArLabel"),
        subjectEn: t("campaigns.subjectEnLabel"),
        bodyAr: t("campaigns.bodyArLabel"),
        bodyEn: t("campaigns.bodyEnLabel"),
        coverImageUrl: t("campaigns.coverImageUrlLabel"),
        slug: t("campaigns.slugLabel"),
        excerptAr: t("campaigns.excerptArLabel"),
        excerptEn: t("campaigns.excerptEnLabel"),
        isWebsitePublic: t("campaigns.publicOnSiteLabel"),
        status: t("campaigns.status"),
      };
      return labels[key] ?? key;
    },
    [t],
  );

  useEffect(() => {
    if (mode === "create") {
      setSubjectAr("");
      setSubjectEn("");
      setBodyAr("");
      setBodyEn("");
      setCoverImageUrl("");
      setIsWebsitePublic(false);
      setSlug("");
      setExcerptAr("");
      setExcerptEn("");
      return;
    }
    if (!detail?.id) return;
    setSubjectAr(detail.subjectAr);
    setSubjectEn(detail.subjectEn);
    setBodyAr(detail.bodyAr);
    setBodyEn(detail.bodyEn);
    setCoverImageUrl(detail.coverImageUrl ?? "");
    setIsWebsitePublic(detail.isWebsitePublic ?? false);
    setSlug(detail.slug ?? "");
    setExcerptAr(detail.excerptAr ?? "");
    setExcerptEn(detail.excerptEn ?? "");
  }, [mode, detail?.id]);

  const bodyReadOnly = mode === "view";

  const partialNotice = useMemo(() => {
    if (!detail || detail.status !== "failed") return null;
    const total = detail.activeSubscriberTotal;
    const reached = detail.sendCounts.sent + detail.sendCounts.failed;
    if (total > 0 && reached > 0 && reached < total) {
      return t("campaigns.partialNotice", { sent: reached, total });
    }
    return null;
  }, [detail, t]);

  const draftKeyAr =
    mode === "create"
      ? "newsletter-campaign:create:bodyAr"
      : `newsletter-campaign:edit:${campaignId}:bodyAr`;
  const draftKeyEn =
    mode === "create"
      ? "newsletter-campaign:create:bodyEn"
      : `newsletter-campaign:edit:${campaignId}:bodyEn`;

  const canSend =
    deliveryEnabled &&
    Boolean(campaignId) &&
    detail?.status === "draft" &&
    subjectAr.trim() !== "" &&
    subjectEn.trim() !== "" &&
    !isRichTextEmpty(bodyAr) &&
    !isRichTextEmpty(bodyEn);

  const saveDraft = async () => {
    if (!deliveryEnabled || bodyReadOnly) return;
    setSaving(true);
    setServerFieldErrors({});
    try {
      if (mode === "create") {
        const { id } = await apiClient.contentNewsletter.createCampaign({
          subjectAr,
          subjectEn,
          bodyAr,
          bodyEn,
          coverImageUrl: coverImageUrl.trim() || undefined,
          isWebsitePublic,
          slug: slug.trim() || undefined,
          excerptAr: excerptAr.trim() || undefined,
          excerptEn: excerptEn.trim() || undefined,
        });
        setServerFieldErrors({});
        clearDraft(draftKeyAr);
        clearDraft(draftKeyEn);
        toast.success(t("campaigns.saved"));
        router.push(`/content/newsletter/${id}`);
      } else if (campaignId) {
        await apiClient.contentNewsletter.updateCampaign(campaignId, {
          subjectAr,
          subjectEn,
          bodyAr,
          bodyEn,
          isWebsitePublic,
          slug: slug.trim(),
          excerptAr,
          excerptEn,
          ...(coverImageUrl.trim()
            ? { coverImageUrl: coverImageUrl.trim() }
            : {}),
        });
        setServerFieldErrors({});
        clearDraft(draftKeyAr);
        clearDraft(draftKeyEn);
        toast.success(t("campaigns.saved"));
        await mutateDetail();
      }
    } catch (e) {
      if (isApiClientError(e)) {
        setServerFieldErrors(validationDetailsToFieldErrors(e.details));
        toast.error(e.message);
      } else {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    } finally {
      setSaving(false);
    }
  };

  const sendCampaign = useCallback(async () => {
    if (!campaignId || !deliveryEnabled) return;
    setSending(true);
    setServerFieldErrors({});
    try {
      await apiClient.contentNewsletter.sendCampaign(campaignId);
      toast.success(t("campaigns.send"));
      await mutateDetail();
    } catch (e) {
      if (isApiClientError(e)) {
        setServerFieldErrors(validationDetailsToFieldErrors(e.details));
        toast.error(e.message);
      } else {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    } finally {
      setSending(false);
    }
  }, [campaignId, deliveryEnabled, mutateDetail, t]);

  const resumeCampaign = useCallback(async () => {
    if (!campaignId || !deliveryEnabled) return;
    setResuming(true);
    setServerFieldErrors({});
    try {
      await apiClient.contentNewsletter.resumeCampaign(campaignId);
      toast.success(t("campaigns.resumed"));
      await mutateDetail();
    } catch (e) {
      if (isApiClientError(e)) {
        setServerFieldErrors(validationDetailsToFieldErrors(e.details));
        toast.error(e.message);
      } else {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    } finally {
      setResuming(false);
    }
  }, [campaignId, deliveryEnabled, mutateDetail, t]);

  const deleteDraftCampaign = useCallback(async () => {
    if (!campaignId) return;
    setDeleting(true);
    try {
      await apiClient.contentNewsletter.deleteDraftCampaign(campaignId);
      clearDraft(draftKeyAr);
      clearDraft(draftKeyEn);
      toast.success(t("campaigns.deleted"));
      router.push("/content/newsletter");
    } catch (e) {
      if (isApiClientError(e)) {
        setServerFieldErrors(validationDetailsToFieldErrors(e.details));
        toast.error(e.message);
      } else {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    } finally {
      setDeleting(false);
    }
  }, [campaignId, router, t]);

  const title =
    mode === "create"
      ? t("campaigns.formCreateTitle")
      : mode === "edit"
        ? t("campaigns.formEditTitle")
        : t("campaigns.formViewTitle");

  if (mode !== "create" && campaignId && detailLoading && !detail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t("campaigns.loading")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (mode !== "create" && campaignId && !detail && !detailLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {t("campaigns.notFound")}
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/content/newsletter">{t("campaigns.backToList")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {detail ? (
            <CardDescription>
              {t("campaigns.detailLoaded", { id: detail.id })} — {detail.status}
            </CardDescription>
          ) : null}
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/content/newsletter">{t("campaigns.backToList")}</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!deliveryEnabled ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
            {t("disabled")}
          </p>
        ) : null}

        {detail ? (
          <div
            className="rounded-lg border border-border/80 bg-muted/25 p-4"
            aria-label={t("campaigns.insightsTitle")}
          >
            <p className="text-foreground mb-3 text-sm font-medium">
              {t("campaigns.insightsTitle")}
            </p>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium">
                  {t("campaigns.insightsActiveSubscribers")}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight">
                  {detail.activeSubscriberTotal}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium">
                  {t("campaigns.insightsSent")}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight">
                  {detail.sendCounts.sent}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium">
                  {t("campaigns.insightsFailed")}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight">
                  {detail.sendCounts.failed}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium">
                  {t("campaigns.insightsPending")}
                </dt>
                <dd className="text-2xl font-semibold tabular-nums tracking-tight">
                  {detail.sendCounts.pending}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {partialNotice ? (
          <p className="text-muted-foreground text-sm">{partialNotice}</p>
        ) : null}

        {Object.keys(serverFieldErrors).length > 0 ? (
          <div
            className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm shadow-sm"
            role="alert"
            aria-live="polite"
          >
            <p className="font-medium text-destructive">
              {t("campaigns.validationIssuesTitle")}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t("campaigns.validationIssuesHint")}
            </p>
            <ul className="mt-2 list-disc space-y-1.5 ps-5 text-destructive">
              {Object.entries(serverFieldErrors).map(([key, msg]) => (
                <li key={key}>
                  <span className="font-medium text-destructive">
                    {serverFieldLabel(key)}:
                  </span>{" "}
                  <span className="text-destructive/95">{msg}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="newsletter-subject-ar">
            {t("campaigns.subjectArLabel")}
          </Label>
          {bodyReadOnly ? (
            <p className="text-sm" dir="rtl">
              {subjectAr}
            </p>
          ) : (
            <Input
              id="newsletter-subject-ar"
              value={subjectAr}
              onChange={(e) => {
                setSubjectAr(e.target.value);
                clearServerError("subjectAr");
              }}
              maxLength={NEWSLETTER_SUBJECT_MAX_CHARS}
              dir="rtl"
              aria-invalid={Boolean(serverFieldErrors.subjectAr)}
            />
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newsletter-subject-en">
            {t("campaigns.subjectEnLabel")}
          </Label>
          {bodyReadOnly ? (
            <p className="text-sm" dir="ltr">
              {subjectEn}
            </p>
          ) : (
            <Input
              id="newsletter-subject-en"
              value={subjectEn}
              onChange={(e) => {
                setSubjectEn(e.target.value);
                clearServerError("subjectEn");
              }}
              maxLength={NEWSLETTER_SUBJECT_MAX_CHARS}
              dir="ltr"
              aria-invalid={Boolean(serverFieldErrors.subjectEn)}
            />
          )}
        </div>

        <div className="space-y-4 rounded-lg border border-border/80 bg-muted/15 p-4">
          <div>
            <p className="text-foreground text-sm font-medium">
              {t("campaigns.websiteSectionTitle")}
            </p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {t("campaigns.websiteSectionHint")}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newsletter-cover-url">
              {t("campaigns.coverImageUrlLabel")}
            </Label>
            {bodyReadOnly ? (
              <p className="text-muted-foreground text-sm wrap-break-word">
                {coverImageUrl.trim() ? coverImageUrl : "—"}
              </p>
            ) : (
              <Input
                id="newsletter-cover-url"
                value={coverImageUrl}
                onChange={(e) => {
                  setCoverImageUrl(e.target.value);
                  clearServerError("coverImageUrl");
                }}
                inputMode="url"
                placeholder="https://"
                autoComplete="off"
                aria-invalid={Boolean(serverFieldErrors.coverImageUrl)}
              />
            )}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 bg-background/60 px-3 py-2">
            <Label
              htmlFor="newsletter-public-site"
              className="cursor-pointer text-sm font-medium"
            >
              {t("campaigns.publicOnSiteLabel")}
            </Label>
            {bodyReadOnly ? (
              <span className="text-muted-foreground text-sm">
                {isWebsitePublic ? t("campaigns.yes") : t("campaigns.no")}
              </span>
            ) : (
              <Switch
                id="newsletter-public-site"
                checked={isWebsitePublic}
                onCheckedChange={(v) => {
                  setIsWebsitePublic(v);
                  clearServerError("isWebsitePublic");
                }}
                disabled={!deliveryEnabled}
              />
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newsletter-slug">{t("campaigns.slugLabel")}</Label>
            {bodyReadOnly ? (
              <p className="text-muted-foreground font-mono text-sm wrap-break-word">
                {slug.trim() ? slug : "—"}
              </p>
            ) : (
              <Input
                id="newsletter-slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  clearServerError("slug");
                }}
                maxLength={NEWSLETTER_SLUG_MAX_CHARS}
                dir="ltr"
                className="font-mono"
                placeholder="my-issue-title"
                disabled={!deliveryEnabled}
                aria-invalid={Boolean(serverFieldErrors.slug)}
              />
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newsletter-excerpt-ar">
              {t("campaigns.excerptArLabel")}
            </Label>
            {bodyReadOnly ? (
              <p className="text-sm whitespace-pre-wrap" dir="rtl">
                {excerptAr.trim() ? excerptAr : "—"}
              </p>
            ) : (
              <Textarea
                id="newsletter-excerpt-ar"
                value={excerptAr}
                onChange={(e) => {
                  setExcerptAr(e.target.value);
                  clearServerError("excerptAr");
                }}
                maxLength={NEWSLETTER_EXCERPT_MAX_CHARS}
                dir="rtl"
                rows={3}
                disabled={!deliveryEnabled}
                aria-invalid={Boolean(serverFieldErrors.excerptAr)}
              />
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newsletter-excerpt-en">
              {t("campaigns.excerptEnLabel")}
            </Label>
            {bodyReadOnly ? (
              <p className="text-sm whitespace-pre-wrap" dir="ltr">
                {excerptEn.trim() ? excerptEn : "—"}
              </p>
            ) : (
              <Textarea
                id="newsletter-excerpt-en"
                value={excerptEn}
                onChange={(e) => {
                  setExcerptEn(e.target.value);
                  clearServerError("excerptEn");
                }}
                maxLength={NEWSLETTER_EXCERPT_MAX_CHARS}
                dir="ltr"
                rows={3}
                disabled={!deliveryEnabled}
                aria-invalid={Boolean(serverFieldErrors.excerptEn)}
              />
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="newsletter-body-ar">
            {t("campaigns.bodyArLabel")}
          </Label>
          {bodyReadOnly ? (
            <div className="bg-muted/30 rounded-md border p-3">
              <RichTextDisplay markdown={bodyAr} lang="ar" dir="rtl" />
            </div>
          ) : (
            <SimpleEditor
              value={bodyAr}
              onChange={(markdown) => {
                setBodyAr(markdown);
                clearServerError("bodyAr");
              }}
              lang="ar"
              draftKey={draftKeyAr}
              maxCharacters={NEWSLETTER_BODY_MAX_CHARS}
            />
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newsletter-body-en">
            {t("campaigns.bodyEnLabel")}
          </Label>
          {bodyReadOnly ? (
            <div className="bg-muted/30 rounded-md border p-3">
              <RichTextDisplay markdown={bodyEn} lang="en" dir="ltr" />
            </div>
          ) : (
            <SimpleEditor
              value={bodyEn}
              onChange={(markdown) => {
                setBodyEn(markdown);
                clearServerError("bodyEn");
              }}
              lang="en"
              draftKey={draftKeyEn}
              maxCharacters={NEWSLETTER_BODY_MAX_CHARS}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => void saveDraft()}
            disabled={!deliveryEnabled || saving || bodyReadOnly}
          >
            {detail != null && detail.status !== "draft"
              ? t("campaigns.saveChanges")
              : t("campaigns.saveDraft")}
          </Button>
          {detail?.status === "sending" && campaignId ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" disabled={resuming}>
                  {t("campaigns.resume")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("campaigns.resume")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("campaigns.resumeConfirm")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void resumeCampaign()}>
                    {t("campaigns.resumeConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" disabled={!canSend || sending}>
                  {t("campaigns.send")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("campaigns.send")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("campaigns.sendConfirm")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void sendCampaign()}>
                    {t("campaigns.sendConfirmAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {mode !== "view" && detail?.status === "draft" && campaignId ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10"
                  disabled={deleting}
                >
                  {t("campaigns.deleteDraft")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("campaigns.deleteDraft")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("campaigns.deleteDraftConfirm")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleting}
                    onClick={() => void deleteDraftCampaign()}
                  >
                    {t("campaigns.deleteDraftAction")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>

        {deliveryEnabled && detail != null && detail.status !== "draft" ? (
          <p className="text-muted-foreground text-sm">
            {t("campaigns.draftOnlySend")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
