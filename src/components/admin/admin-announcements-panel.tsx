"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Check, ChevronDown, Megaphone, RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import { AnnouncementType } from "@/shared/enums/announcement-type.enum";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { AdminAnnouncementDTO } from "@/shared/types/announcement.types";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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

type TargetType = "all" | "role" | "segment";

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function AdminAnnouncementsPanel() {
  const locale = useLocale();
  const t = useTranslations("adminAnnouncements");
  const [isHydrated, setIsHydrated] = useState(false);

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [contentAr, setContentAr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [type, setType] = useState<AnnouncementType>(AnnouncementType.FEATURE);
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [targetValue, setTargetValue] = useState("");
  const [segmentSearch, setSegmentSearch] = useState("");
  const [isSegmentSelectOpen, setIsSegmentSelectOpen] = useState(false);
  const [selectedSegmentLabel, setSelectedSegmentLabel] = useState("");
  const [publish, setPublish] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<AdminAnnouncementDTO | null>(null);
  const [editTitleAr, setEditTitleAr] = useState("");
  const [editTitleEn, setEditTitleEn] = useState("");
  const [editContentAr, setEditContentAr] = useState("");
  const [editContentEn, setEditContentEn] = useState("");
  const [editPublishedAt, setEditPublishedAt] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] =
    useState<AdminAnnouncementDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const swrKey = useMemo(() => ["admin-announcements", page] as const, [page]);

  const { data, isLoading, error, mutate } = useSWR(
    swrKey,
    ([, currentPage]) =>
      apiClient.adminAnnouncements.list({
        page: currentPage,
        limit: LIMIT,
      }),
    {
      revalidateOnFocus: false,
    },
  );

  const segmentsSWRKey = useMemo(
    () =>
      targetType === "segment"
        ? (["announcement-segments", segmentSearch] as const)
        : null,
    [targetType, segmentSearch],
  );

  const { data: segmentsData, isLoading: isSegmentsLoading } = useSWR(
    segmentsSWRKey,
    ([, searchQuery]) =>
      apiClient.segments.list({
        q: searchQuery || undefined,
        page: 1,
        limit: 10,
      }),
    {
      revalidateOnFocus: false,
    },
  );

  const items = data?.items ?? [];
  const segments = segmentsData?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: LIMIT, total: 0, totalPages: 1 };
  const totalForDescription = isHydrated ? meta.total : 0;
  const isArabicLocale = /^ar(-|$)/i.test(locale);
  const selectedSegment = segments.find(
    (segment) => segment.id === targetValue,
  );

  const getLocalizedTitle = (item: AdminAnnouncementDTO) =>
    isArabicLocale ? item.titleAr : item.titleEn;

  const getAnnouncementTypeLabel = (value: AnnouncementType) => {
    switch (value) {
      case AnnouncementType.FEATURE:
        return t("types.feature");
      case AnnouncementType.IMPROVEMENT:
        return t("types.improvement");
      case AnnouncementType.FIX:
        return t("types.fix");
      case AnnouncementType.MAINTENANCE:
        return t("types.maintenance");
      case AnnouncementType.ALERT:
        return t("types.alert");
      case AnnouncementType.PROMOTION:
        return t("types.promotion");
      default:
        return t("types.feature");
    }
  };

  const getTargetRoleLabel = (role: string | null) => {
    if (!role) return "-";
    switch (role) {
      case UserRole.USER:
        return t("roles.user");
      case UserRole.STUDENT:
        return t("roles.student");
      case UserRole.PARENT:
        return t("roles.parent");
      case UserRole.SUPPORT:
        return t("roles.support");
      case UserRole.CONTENT:
      case "contentManager":
        return t("roles.content");
      case UserRole.ADMIN:
        return t("roles.admin");
      default:
        return role;
    }
  };

  const resetForm = () => {
    setTitleAr("");
    setTitleEn("");
    setContentAr("");
    setContentEn("");
    setType(AnnouncementType.FEATURE);
    setTargetType("all");
    setTargetValue("");
    setSelectedSegmentLabel("");
    setPublish(true);
    setExpiresAt("");
  };

  const onCreate = async () => {
    if (
      !titleAr.trim() ||
      !titleEn.trim() ||
      !contentAr.trim() ||
      !contentEn.trim()
    ) {
      toast.error(t("toasts.requiredFields"));
      return;
    }

    if (targetType !== "all" && !targetValue.trim()) {
      toast.error(t("toasts.targetValueRequired"));
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.adminAnnouncements.create({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        contentAr: contentAr.trim(),
        contentEn: contentEn.trim(),
        type,
        targetType,
        targetValue: targetType === "all" ? null : targetValue.trim(),
        publish,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      toast.success(t("toasts.created"));
      resetForm();
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

  const openEditModal = (item: AdminAnnouncementDTO) => {
    setEditingAnnouncement(item);
    setEditTitleAr(item.titleAr);
    setEditTitleEn(item.titleEn);
    setEditContentAr(item.contentAr);
    setEditContentEn(item.contentEn);
    setEditPublishedAt(toDateTimeLocalValue(item.publishedAt));
    setEditExpiresAt(toDateTimeLocalValue(item.expiresAt));
  };

  const closeEditModal = () => {
    if (isUpdating) {
      return;
    }

    setEditingAnnouncement(null);
    setEditTitleAr("");
    setEditTitleEn("");
    setEditContentAr("");
    setEditContentEn("");
    setEditPublishedAt("");
    setEditExpiresAt("");
  };

  const onUpdateAnnouncement = async () => {
    if (!editingAnnouncement) {
      return;
    }

    if (
      !editTitleAr.trim() ||
      !editTitleEn.trim() ||
      !editContentAr.trim() ||
      !editContentEn.trim()
    ) {
      toast.error(t("toasts.editRequiredFields"));
      return;
    }

    try {
      setIsUpdating(true);
      await apiClient.adminAnnouncements.update(editingAnnouncement.id, {
        titleAr: editTitleAr.trim(),
        titleEn: editTitleEn.trim(),
        contentAr: editContentAr.trim(),
        contentEn: editContentEn.trim(),
        publishedAt: editPublishedAt
          ? new Date(editPublishedAt).toISOString()
          : null,
        expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
      });

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

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setDeletingAnnouncement(null);
  };

  const onDeleteAnnouncement = async () => {
    if (!deletingAnnouncement) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.adminAnnouncements.delete(deletingAnnouncement.id);
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {t("create.title")}
          </CardTitle>
          <CardDescription>{t("create.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="announcement-title-ar">
                {t("create.titleArLabel")}
              </Label>
              <Input
                id="announcement-title-ar"
                value={titleAr}
                onChange={(event) => setTitleAr(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-title-en">
                {t("create.titleEnLabel")}
              </Label>
              <Input
                id="announcement-title-en"
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="announcement-content-ar">
                {t("create.contentArLabel")}
              </Label>
              <textarea
                id="announcement-content-ar"
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={contentAr}
                onChange={(event) => setContentAr(event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="announcement-content-en">
                {t("create.contentEnLabel")}
              </Label>
              <textarea
                id="announcement-content-en"
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={contentEn}
                onChange={(event) => setContentEn(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-type">{t("create.typeLabel")}</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as AnnouncementType)}
              >
                <SelectTrigger id="announcement-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AnnouncementType.FEATURE}>
                    {t("types.feature")}
                  </SelectItem>
                  <SelectItem value={AnnouncementType.IMPROVEMENT}>
                    {t("types.improvement")}
                  </SelectItem>
                  <SelectItem value={AnnouncementType.FIX}>
                    {t("types.fix")}
                  </SelectItem>
                  <SelectItem value={AnnouncementType.MAINTENANCE}>
                    {t("types.maintenance")}
                  </SelectItem>
                  <SelectItem value={AnnouncementType.ALERT}>
                    {t("types.alert")}
                  </SelectItem>
                  <SelectItem value={AnnouncementType.PROMOTION}>
                    {t("types.promotion")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("create.targetTypeLabel")}</Label>
              <Select
                value={targetType}
                onValueChange={(value) => {
                  setTargetType(value as TargetType);
                  if (value === "all") {
                    setTargetValue("");
                  }

                  if (value === "role") {
                    setTargetValue(UserRole.USER);
                  }

                  if (value === "segment") {
                    setSegmentSearch("");
                    setTargetValue("");
                    setSelectedSegmentLabel("");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("targets.all")}</SelectItem>
                  <SelectItem value="role">{t("targets.role")}</SelectItem>
                  <SelectItem value="segment">
                    {t("targets.segment")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType === "role" ? (
              <div className="space-y-2">
                <Label htmlFor="announcement-target-role">
                  {t("create.targetRoleLabel")}
                </Label>
                <Select
                  value={targetValue || UserRole.USER}
                  onValueChange={setTargetValue}
                >
                  <SelectTrigger id="announcement-target-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.USER}>
                      {t("roles.user")}
                    </SelectItem>
                    <SelectItem value={UserRole.STUDENT}>
                      {t("roles.student")}
                    </SelectItem>
                    <SelectItem value={UserRole.PARENT}>
                      {t("roles.parent")}
                    </SelectItem>
                    <SelectItem value={UserRole.SUPPORT}>
                      {t("roles.support")}
                    </SelectItem>
                    <SelectItem value={UserRole.CONTENT}>
                      {t("roles.content")}
                    </SelectItem>
                    <SelectItem value={UserRole.ADMIN}>
                      {t("roles.admin")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {targetType === "segment" ? (
              <div className="space-y-2">
                <Label htmlFor="announcement-target-value">
                  {t("create.targetSegmentLabel")}
                </Label>
                <DropdownMenu
                  open={isSegmentSelectOpen}
                  onOpenChange={(open) => {
                    setIsSegmentSelectOpen(open);
                    if (open) {
                      setSegmentSearch("");
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      id="announcement-target-value"
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {selectedSegment
                          ? `${selectedSegment.icon} ${selectedSegment.name}`
                          : selectedSegmentLabel ||
                            t("create.segmentPlaceholder")}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-(--radix-dropdown-menu-trigger-width)"
                  >
                    <div
                      className="px-1 pb-1"
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <Input
                        id="announcement-target-segment-search"
                        className="w-full"
                        value={segmentSearch}
                        onChange={(event) =>
                          setSegmentSearch(event.target.value)
                        }
                        placeholder={t("create.searchSegmentPlaceholder")}
                      />
                    </div>
                    {segments.map((segment) => (
                      <DropdownMenuItem
                        key={segment.id}
                        onSelect={() => {
                          setTargetValue(segment.id);
                          setSelectedSegmentLabel(
                            `${segment.icon} ${segment.name}`,
                          );
                          setIsSegmentSelectOpen(false);
                        }}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Check
                            className={
                              targetValue === segment.id
                                ? "h-4 w-4 opacity-100"
                                : "h-4 w-4 opacity-0"
                            }
                          />
                          <span className="truncate">
                            {segment.icon} {segment.name}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {isSegmentsLoading ? (
                  <p className="text-xs text-muted-foreground">
                    {t("create.loadingSegments")}
                  </p>
                ) : null}
                {!isSegmentsLoading && segments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("create.noSegmentsFound")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="announcement-expires">
                {t("create.expiresAtLabel")}
              </Label>
              <Input
                id="announcement-expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
              <div>
                <p className="text-sm font-medium">
                  {t("create.publishLabel")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("create.publishHint")}
                </p>
              </div>
              <Switch checked={publish} onCheckedChange={setPublish} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={onCreate} disabled={isSaving}>
              {isSaving ? t("create.saving") : t("create.submit")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
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

        <CardContent>
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
                    <TableHead>{t("columns.title")}</TableHead>
                    <TableHead>{t("columns.type")}</TableHead>
                    <TableHead>{t("columns.target")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.seenCount")}</TableHead>
                    <TableHead>{t("columns.createdAt")}</TableHead>
                    <TableHead className="text-end">
                      {t("columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {getLocalizedTitle(item)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getAnnouncementTypeLabel(item.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.targetType === "all"
                          ? t("targets.all")
                          : item.targetType === "segment"
                            ? `${t("targets.segment")}: ${item.targetLabel ?? item.targetValue ?? "-"}`
                            : `${t("targets.role")}: ${getTargetRoleLabel(item.targetValue)}`}
                      </TableCell>
                      <TableCell>
                        {item.publishedAt
                          ? t("statuses.published")
                          : t("statuses.draft")}
                      </TableCell>
                      <TableCell>{item.seenCount}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(item)}
                          >
                            {t("list.edit")}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingAnnouncement(item)}
                          >
                            {t("list.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text={t("list.previous")}
                      ariaLabel={t("list.previous")}
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
                      text={t("list.next")}
                      ariaLabel={t("list.next")}
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
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(editingAnnouncement)}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-announcement-title-ar">
                  {t("edit.titleArLabel")}
                </Label>
                <Input
                  id="edit-announcement-title-ar"
                  value={editTitleAr}
                  onChange={(event) => setEditTitleAr(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-announcement-title-en">
                  {t("edit.titleEnLabel")}
                </Label>
                <Input
                  id="edit-announcement-title-en"
                  value={editTitleEn}
                  onChange={(event) => setEditTitleEn(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-announcement-content-ar">
                {t("edit.contentArLabel")}
              </Label>
              <Textarea
                id="edit-announcement-content-ar"
                className="min-h-28"
                value={editContentAr}
                onChange={(event) => setEditContentAr(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-announcement-content-en">
                {t("edit.contentEnLabel")}
              </Label>
              <Textarea
                id="edit-announcement-content-en"
                className="min-h-28"
                value={editContentEn}
                onChange={(event) => setEditContentEn(event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-announcement-published-at">
                  {t("edit.publishedAtLabel")}
                </Label>
                <Input
                  id="edit-announcement-published-at"
                  type="datetime-local"
                  value={editPublishedAt}
                  onChange={(event) => setEditPublishedAt(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-announcement-expires-at">
                  {t("edit.expiresAtLabel")}
                </Label>
                <Input
                  id="edit-announcement-expires-at"
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(event) => setEditExpiresAt(event.target.value)}
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
              onClick={onUpdateAnnouncement}
              disabled={isUpdating}
            >
              {isUpdating ? t("edit.saving") : t("edit.save")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deletingAnnouncement)}
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
                title: deletingAnnouncement
                  ? getLocalizedTitle(deletingAnnouncement)
                  : "",
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
              onClick={onDeleteAnnouncement}
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
