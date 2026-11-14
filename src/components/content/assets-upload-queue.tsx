"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssetTagEditor } from "@/components/content/asset-tag-editor";
import type { UploadQueueItem } from "@/hooks/use-upload-queue";

type AssetsUploadQueueProps = {
  items: UploadQueueItem[];
  onRetry: (id: string) => void | Promise<void>;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
  autoCollapse?: boolean;
};

function statusVariant(
  status: UploadQueueItem["status"],
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "done") return "secondary";
  if (status === "error") return "destructive";
  if (status === "uploading" || status === "finalizing") return "default";
  return "outline";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AssetsUploadQueue({
  items,
  onRetry,
  onCancel,
  onRemove,
  onUpdateTags,
  autoCollapse = true,
}: AssetsUploadQueueProps) {
  const t = useTranslations("contentAssets");
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = useMemo(
    () => items.filter((item) => item.status === "done").length,
    [items],
  );
  const hasInProgress = useMemo(
    () =>
      items.some(
        (item) =>
          item.status === "pending" ||
          item.status === "uploading" ||
          item.status === "finalizing",
      ),
    [items],
  );
  const hasErrors = useMemo(
    () => items.some((item) => item.status === "error"),
    [items],
  );

  useEffect(() => {
    if (!autoCollapse || items.length === 0) {
      return;
    }

    const allDone = items.every((item) => item.status === "done");
    if (allDone) {
      setCollapsed(true);
      return;
    }

    setCollapsed(false);
  }, [autoCollapse, items]);

  const clearCompleted = () => {
    items
      .filter((item) => item.status === "done")
      .forEach((item) => onRemove(item.id));
  };

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {t("queue.noFilesQueued")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="text-sm text-muted-foreground">
          {t("queue.summary", {
            files: items.length,
            completed: completedCount,
            inProgressSuffix: hasInProgress ? ` ${t("queue.inProgress")}` : "",
            errorsSuffix: hasErrors ? ` ${t("queue.errors")}` : "",
          })}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={clearCompleted}
            disabled={completedCount === 0}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("queue.clearCompleted")}
          </Button>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                {t("queue.expand")}
              </>
            ) : (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                {t("queue.collapse")}
              </>
            )}
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="space-y-3">
          {items.map((item) => {
            const progressPercent = Math.round(item.progress * 100);

            return (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(item.status)}>
                    {item.status === "pending"
                      ? t("statusBadges.pending")
                      : item.status === "uploading"
                        ? t("statusBadges.uploading")
                        : item.status === "finalizing"
                          ? t("statusBadges.finalizing")
                          : item.status === "done"
                            ? t("statusBadges.done")
                            : t("statusBadges.error")}
                  </Badge>
                </div>

                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      item.status === "error" ? "bg-destructive" : "bg-primary"
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                    }}
                  />
                </div>

                {item.status === "pending" ? (
                  <div className="mb-3">
                    <AssetTagEditor
                      value={item.tags}
                      onChange={(tags) => onUpdateTags(item.id, tags)}
                    />
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {item.status === "uploading" || item.status === "finalizing"
                      ? `${t("progress.uploadingN", {
                          current: formatBytes(item.file.size * item.progress),
                        })} ${t("progress.ofN", {
                          total: formatBytes(item.file.size),
                        })}`
                      : `${progressPercent}%`}
                  </p>

                  {item.status === "done" && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("statusBadges.done")}
                    </span>
                  )}

                  {item.status === "error" && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {item.error ?? t("errors.uploadFailed")}
                      </span>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          void onRetry(item.id);
                        }}
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        {t("common.retry")}
                      </Button>
                    </div>
                  )}

                  {(item.status === "pending" ||
                    item.status === "uploading" ||
                    item.status === "finalizing") && (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => onCancel(item.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("common.cancel")}
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("queue.remove")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
