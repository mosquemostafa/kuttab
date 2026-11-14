"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import type { AssetResponseDto } from "@/server/modules/assets/asset.dto";
import type { AssetsLibraryToolbarFilters } from "@/components/content/assets-library-toolbar";
import { AssetCard } from "@/components/content/asset-card";
import { AssetFileCard } from "@/components/content/asset-file-card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/api-client";

const PAGE_SIZE = 12;

type AssetsGridProps = {
  filters: AssetsLibraryToolbarFilters;
  forcedResourceType?: "image" | "raw";
  refreshKey?: number;
  onDeleteCompleted?: () => void;
};

export function AssetsGrid({
  filters,
  forcedResourceType,
  refreshKey = 0,
  onDeleteCompleted,
}: AssetsGridProps) {
  const t = useTranslations("contentAssets");
  const [items, setItems] = useState<AssetResponseDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveFilters = useMemo<AssetsLibraryToolbarFilters>(() => {
    if (!forcedResourceType) {
      return filters;
    }

    return {
      ...filters,
      resourceType: forcedResourceType,
    };
  }, [filters, forcedResourceType]);

  useEffect(() => {
    setPage(1);
  }, [
    effectiveFilters.q,
    effectiveFilters.folder,
    effectiveFilters.format,
    effectiveFilters.tag,
    effectiveFilters.resourceType,
  ]);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.contentAssets.list({
        q: effectiveFilters.q,
        folder: effectiveFilters.folder,
        format: effectiveFilters.format,
        resourceType: effectiveFilters.resourceType,
        tags: effectiveFilters.tag ? [effectiveFilters.tag] : undefined,
        page,
        limit: PAGE_SIZE,
      });

      const resolvedTotal = result.meta.total ?? result.items.length;
      const resolvedTotalPages =
        result.meta.totalPages ??
        Math.max(1, Math.ceil(resolvedTotal / PAGE_SIZE));

      setItems(result.items);
      setTotal(resolvedTotal);
      setTotalPages(resolvedTotalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.loadFailed"));
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveFilters, page, t]);

  useEffect(() => {
    void fetchAssets();
  }, [fetchAssets, refreshKey]);

  const onDelete = useCallback(
    async (id: string) => {
      try {
        await apiClient.contentAssets.delete(id);

        setItems((prev) => prev.filter((item) => item.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
        toast.success(t("toasts.deleteSuccess"));

        const remainingOnPage = items.length - 1;
        if (remainingOnPage <= 0 && page > 1) {
          setPage((prev) => prev - 1);
          onDeleteCompleted?.();
          return;
        }

        void fetchAssets();
        onDeleteCompleted?.();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errors.deleteFailed");
        setError(message);
        toast.error(message);
        throw new Error(message);
      }
    },
    [fetchAssets, items.length, onDeleteCompleted, page, t],
  );

  const onEditAsset = useCallback(
    async (id: string, payload: { filename: string; tags: string[] }) => {
      try {
        const current = items.find((item) => item.id === id);

        if (!current) {
          throw new Error(t("errors.loadFailed"));
        }

        let updated = current;
        let didUpdate = false;

        if (payload.filename !== current.filename) {
          updated = await apiClient.contentAssets.update(id, {
            filename: payload.filename,
          });
          didUpdate = true;
        }

        const tagsChanged =
          payload.tags.length !== updated.tags.length ||
          payload.tags.some((tag, index) => tag !== updated.tags[index]);

        if (tagsChanged) {
          updated = await apiClient.contentAssets.update(id, {
            tags: payload.tags,
          });
          didUpdate = true;
        }

        setItems((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );

        if (didUpdate) {
          toast.success(t("toasts.updateSuccess"));
        }

        return {
          filename: updated.filename,
          tags: updated.tags,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t("errors.updateAssetFailed");
        setError(message);
        toast.error(message);
        throw new Error(message);
      }
    },
    [items, t],
  );

  const onReplaceAsset = useCallback((updated: AssetResponseDto) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    );
  }, []);

  const summary = useMemo(() => {
    if (total === 0) return t("emptyState.noAssetsFound");
    return t("grid.showingSummary", { showing: items.length, total });
  }, [items.length, t, total]);

  const hasActiveFilters =
    Boolean(effectiveFilters.q) ||
    Boolean(effectiveFilters.folder) ||
    Boolean(effectiveFilters.format) ||
    Boolean(effectiveFilters.tag) ||
    (!forcedResourceType && Boolean(effectiveFilters.resourceType));

  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t("grid.loadingAssets")}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void fetchAssets()}
        >
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{summary}</p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {hasActiveFilters
            ? t("emptyState.noAssetsFound")
            : t("emptyState.uploadFirst")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) =>
            item.resourceType === "raw" ? (
              <AssetFileCard
                key={item.id}
                asset={{
                  id: item.id,
                  publicId: item.publicId,
                  secureUrl: item.secureUrl,
                  filename: item.filename,
                  originalFilename: item.originalFilename,
                  folder: item.folder,
                  format: item.format,
                  bytes: item.bytes,
                  tags: item.tags,
                  resourceType: item.resourceType,
                }}
                onDelete={onDelete}
                onEditAsset={onEditAsset}
                onReplaceAsset={onReplaceAsset}
              />
            ) : (
              <AssetCard
                key={item.id}
                asset={{
                  id: item.id,
                  publicId: item.publicId,
                  secureUrl: item.secureUrl,
                  filename: item.filename,
                  originalFilename: item.originalFilename,
                  folder: item.folder,
                  format: item.format,
                  bytes: item.bytes,
                  tags: item.tags,
                  resourceType: item.resourceType,
                }}
                onDelete={onDelete}
                onEditAsset={onEditAsset}
                onReplaceAsset={onReplaceAsset}
                prioritizeImage={index === 0}
              />
            ),
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1 || isLoading}
        >
          {t("grid.previous")}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t("grid.pageOf", { page, totalPages })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages || isLoading}
        >
          {t("grid.next")}
        </Button>
      </div>
    </div>
  );
}
