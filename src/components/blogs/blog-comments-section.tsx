"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/api-client";
import { cn } from "@/lib/utils";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { BlogCommentDTO } from "@/shared/types/blog-comment.types";

const PAGE_SIZE = 10;

function isStaffRole(role: string | null | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.CONTENT_MANAGER;
}

function formatCommentDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) {
      return (a + b).toUpperCase();
    }
  }
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

/** Null, empty, or whitespace-only — show initials fallback only. */
function resolveAvatarImageSrc(
  image: string | null | undefined,
): string | undefined {
  const trimmed = image?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

type BlogCommentsSectionProps = {
  blogSlug: string;
  locale: string;
  currentUserId: string;
  userRole: string | null;
};

export function BlogCommentsSection({
  blogSlug,
  locale,
  currentUserId,
  userRole,
}: BlogCommentsSectionProps) {
  const t = useTranslations("blogs");
  const staff = isStaffRole(userRole);

  const [comments, setComments] = useState<BlogCommentDTO[]>([]);
  const [loadedPage, setLoadedPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogCommentDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasMore = useMemo(
    () => loadedPage > 0 && loadedPage < totalPages,
    [loadedPage, totalPages],
  );

  const loadPage = useCallback(
    async (page: number, mode: "replace" | "append") => {
      if (mode === "replace") {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const { items, meta } = await apiClient.blogComments.listBySlug(
          blogSlug,
          { page, limit: PAGE_SIZE },
        );
        if (mode === "replace") {
          setComments(items);
        } else {
          setComments((prev) => [...prev, ...items]);
        }
        setLoadedPage(page);
        setTotalPages(meta.totalPages);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : t("comments.toast.loadFailed"),
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [blogSlug, t],
  );

  useEffect(() => {
    void loadPage(1, "replace");
  }, [loadPage]);

  const handleSubmitNew = async () => {
    const body = newBody.trim();
    if (!body) {
      toast.error(t("comments.toast.emptyBody"));
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiClient.blogComments.create(blogSlug, { body });
      setComments((prev) => [...prev, created]);
      setNewBody("");
      toast.success(t("comments.toast.createSuccess"));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("comments.toast.createFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c: BlogCommentDTO) => {
    setEditingId(c.id);
    setEditDraft(c.body);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const saveEdit = async (c: BlogCommentDTO) => {
    const body = editDraft.trim();
    if (!body) {
      toast.error(t("comments.toast.emptyBody"));
      return;
    }
    const own = c.userId === currentUserId;
    setSavingEditId(c.id);
    try {
      const updated = own
        ? await apiClient.blogComments.updateOwn(c.id, { body })
        : await apiClient.blogComments.updateAsStaff(c.id, { body });
      setComments((prev) =>
        prev.map((row) => (row.id === c.id ? updated : row)),
      );
      cancelEdit();
      toast.success(t("comments.toast.updateSuccess"));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("comments.toast.updateFailed"),
      );
    } finally {
      setSavingEditId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const c = deleteTarget;
    const own = c.userId === currentUserId;
    setDeleting(true);
    try {
      if (own) {
        await apiClient.blogComments.deleteOwn(c.id);
      } else {
        await apiClient.blogComments.deleteAsStaff(c.id);
      }
      setComments((prev) => prev.filter((row) => row.id !== c.id));
      setDeleteTarget(null);
      toast.success(t("comments.toast.deleteSuccess"));
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("comments.toast.deleteFailed"),
      );
    } finally {
      setDeleting(false);
    }
  };

  const canModify = (c: BlogCommentDTO): boolean => {
    if (c.userId === currentUserId) {
      return true;
    }
    return staff;
  };

  return (
    <section aria-labelledby="blog-comments-heading">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MessageCircle className="size-5" aria-hidden />
        </div>
        <div>
          <h2
            id="blog-comments-heading"
            className="text-lg font-semibold tracking-tight md:text-xl"
          >
            {t("comments.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("comments.subtitle")}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/50 p-4 shadow-sm ring-1 ring-foreground/5 md:p-5">
        <label className="sr-only" htmlFor="new-comment-body">
          {t("comments.composerLabel")}
        </label>
        <Textarea
          id="new-comment-body"
          dir={locale.startsWith("ar") ? "rtl" : "ltr"}
          placeholder={t("comments.composerPlaceholder")}
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={4}
          className="min-h-[100px] resize-y bg-background/80"
          disabled={submitting}
        />
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            className="gap-2"
            onClick={() => void handleSubmitNew()}
            disabled={submitting || !newBody.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("comments.posting")}
              </>
            ) : (
              t("comments.postComment")
            )}
          </Button>
        </div>
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            {t("comments.empty")}
          </p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => {
              const isYou = c.userId === currentUserId;
              const showActions = canModify(c);
              const isEditing = editingId === c.id;
              const avatarSrc = resolveAvatarImageSrc(c.authorImage);

              return (
                <li key={c.id}>
                  <article
                    className={cn(
                      "rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors md:p-5",
                      isYou && "border-primary/25 bg-primary/3",
                    )}
                  >
                    <div className="flex gap-3">
                      <Avatar size="sm" className="mt-0.5">
                        {avatarSrc ? (
                          <AvatarImage
                            src={avatarSrc}
                            alt=""
                            aria-hidden
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <AvatarFallback
                          className="bg-muted text-xs font-medium text-muted-foreground"
                          delayMs={avatarSrc ? undefined : 0}
                        >
                          {initialsFromName(c.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-foreground">
                            {c.authorName}
                            {isYou ? (
                              <span className="ms-1.5 font-normal text-muted-foreground">
                                ({t("comments.you")})
                              </span>
                            ) : null}
                          </span>
                          <time
                            className="text-xs text-muted-foreground"
                            dateTime={c.updatedAt}
                          >
                            {formatCommentDate(c.updatedAt, locale)}
                          </time>
                        </div>

                        {isEditing ? (
                          <div className="mt-3 space-y-3">
                            <Textarea
                              dir={locale.startsWith("ar") ? "rtl" : "ltr"}
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              rows={4}
                              className="min-h-[88px] bg-background"
                              disabled={savingEditId === c.id}
                            />
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => void saveEdit(c)}
                                disabled={savingEditId === c.id}
                              >
                                {savingEditId === c.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : null}
                                {t("comments.save")}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelEdit}
                                disabled={savingEditId === c.id}
                              >
                                {t("comments.cancel")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p
                              className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90"
                              dir="auto"
                            >
                              {c.body}
                            </p>
                            {showActions ? (
                              <div className="mt-3 flex gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-muted-foreground"
                                  onClick={() => startEdit(c)}
                                >
                                  <Pencil className="size-3.5" />
                                  {t("comments.edit")}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteTarget(c)}
                                >
                                  <Trash2 className="size-3.5" />
                                  {t("comments.delete")}
                                </Button>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {hasMore ? (
          <div className="mt-8 flex justify-center">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => void loadPage(loadedPage + 1, "append")}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("comments.loadingMore")}
                </>
              ) : (
                t("comments.loadMore")
              )}
            </Button>
          </div>
        ) : null}
      </div>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("comments.deleteDialogTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("comments.deleteDialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("comments.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("comments.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
