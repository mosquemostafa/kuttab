"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import type { SegmentDTO } from "@/shared/types/segment.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const LIMIT = 10;

export function SegmentsTable() {
  const t = useTranslations("adminSegments");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editing, setEditing] = useState<SegmentDTO | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<SegmentDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const swrKey = useMemo(() => ["segments", q, page] as const, [q, page]);

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    ([, currentQuery, currentPage]) =>
      apiClient.segments.list({
        q: currentQuery || undefined,
        page: currentPage,
        limit: LIMIT,
      }),
    { revalidateOnFocus: false },
  );

  const items = data?.items ?? [];
  const meta = data?.meta ?? { page: 1, limit: LIMIT, total: 0, totalPages: 1 };

  const onCreate = async () => {
    const trimmedName = newName.trim();
    const trimmedIcon = newIcon.trim();

    if (!trimmedName || !trimmedIcon) {
      return;
    }

    try {
      setIsCreating(true);
      await apiClient.segments.create({
        name: trimmedName,
        icon: trimmedIcon,
      });
      toast.success(t("toasts.created"));
      setNewName("");
      setNewIcon("");
      setPage(1);
      mutate();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (item: SegmentDTO) => {
    setEditing(item);
    setEditName(item.name);
    setEditIcon(item.icon);
  };

  const onSaveEdit = async () => {
    if (!editing) {
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.segments.update(editing.id, {
        name: editName.trim(),
        icon: editIcon.trim(),
      });
      toast.success(t("toasts.updated"));
      setEditing(null);
      mutate();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await apiClient.segments.delete(pendingDelete.id);
      toast.success(t("toasts.deleted"));
      setPendingDelete(null);
      mutate();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-62 flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => {
                  setQ(event.target.value);
                  setPage(1);
                }}
                className="pl-8"
                placeholder={t("controls.search")}
              />
            </div>

            <Button type="button" variant="outline" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
              {t("controls.refresh")}
            </Button>
          </div>

          <div className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_140px_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="segment-name">{t("controls.name")}</Label>
              <Input
                id="segment-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="segment-icon">{t("controls.icon")}</Label>
              <Input
                id="segment-icon"
                value={newIcon}
                onChange={(event) => setNewIcon(event.target.value)}
              />
            </div>

            <Button type="button" onClick={onCreate} disabled={isCreating}>
              {isCreating ? t("controls.creating") : t("controls.create")}
            </Button>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{t("states.loadFailed")}</p>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("columns.segment")}</TableHead>
                    <TableHead>{t("columns.name")}</TableHead>
                    <TableHead>{t("columns.emoji")}</TableHead>
                    <TableHead>{t("columns.createdAt")}</TableHead>
                    <TableHead className="w-36">
                      {t("columns.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-6 w-28" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-12" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-36" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-28" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-sm text-muted-foreground"
                      >
                        {t("states.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex w-fit items-center gap-1"
                          >
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.icon}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(
                            new Date(item.createdAt),
                            "MMM d, yyyy h:mm a",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              onClick={() => openEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">
                                {t("actions.edit")}
                              </span>
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="destructive"
                              onClick={() => setPendingDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">
                                {t("actions.delete")}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t("summary", { count: items.length, total: meta.total })}
            </div>
            {meta.totalPages > 1 ? (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text={t("pagination.previous")}
                      ariaLabel={t("pagination.previousAria")}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                          isActive={pageNumber === meta.page}
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      text={t("pagination.next")}
                      ariaLabel={t("pagination.nextAria")}
                      onClick={() =>
                        setPage((p) => Math.min(meta.totalPages, p + 1))
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
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={Boolean(editing)}
        onClose={() => {
          if (!isSaving) {
            setEditing(null);
          }
        }}
        onConfirm={onSaveEdit}
        title={t("dialogs.editTitle")}
        description={t("dialogs.editDescription")}
        confirmText={isSaving ? t("dialogs.saving") : t("dialogs.save")}
      >
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">{t("dialogs.name")}</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-icon">{t("dialogs.icon")}</Label>
            <Input
              id="edit-icon"
              value={editIcon}
              onChange={(event) => setEditIcon(event.target.value)}
            />
          </div>
        </div>
      </ConfirmationDialog>

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => {
          if (!isDeleting) {
            setPendingDelete(null);
          }
        }}
        onConfirm={onDelete}
        title={t("dialogs.deleteTitle")}
        description={t("dialogs.deleteDescription", {
          name: pendingDelete?.name ?? t("dialogs.deleteFallback"),
        })}
        confirmText={
          isDeleting ? t("dialogs.deleting") : t("dialogs.confirmDelete")
        }
        cancelText={t("dialogs.cancel")}
        confirmVariant="destructive"
      />
    </div>
  );
}
