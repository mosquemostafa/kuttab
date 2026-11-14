"use client";

import { useEffect, useState } from "react";
import {
  Copy,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  FileType2,
  FolderInput,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { downloadAsset } from "@/lib/assets/download";
import { AssetEditTagsModal } from "@/components/content/asset-edit-tags-modal";
import { AssetMoveFolderModal } from "@/components/content/asset-move-folder-modal";
import { AssetReplaceModal } from "@/components/content/asset-replace-modal";
import { AssetTags } from "@/components/content/asset-tags";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { AssetResponseDto } from "@/server/modules/assets/asset.dto";

type AssetFileCardItem = {
  id: string;
  publicId: string;
  secureUrl: string;
  filename: string;
  originalFilename: string | null;
  folder: string;
  format: string | null;
  bytes: number;
  tags: string[];
  resourceType: "image" | "video" | "raw";
};

type AssetFileCardProps = {
  asset: AssetFileCardItem;
  onDelete: (id: string) => Promise<void>;
  onEditAsset: (
    id: string,
    payload: { filename: string; tags: string[] },
  ) => Promise<{ filename: string; tags: string[] }>;
  onReplaceAsset: (updated: AssetResponseDto) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatToIcon(format?: string | null) {
  const normalized = (format ?? "").toLowerCase();

  if (normalized === "pdf" || normalized === "txt") {
    return FileText;
  }

  if (normalized === "doc" || normalized === "docx") {
    return FileType2;
  }

  if (normalized === "xls" || normalized === "xlsx") {
    return FileSpreadsheet;
  }

  return File;
}

function extractExtension(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const basename = value.split("/").pop()?.trim() ?? "";

  if (!basename) {
    return null;
  }

  const dotIndex = basename.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === basename.length - 1) {
    return null;
  }

  return basename.slice(dotIndex + 1).toLowerCase();
}

export function AssetFileCard({
  asset,
  onDelete,
  onEditAsset,
  onReplaceAsset,
}: AssetFileCardProps) {
  const t = useTranslations("contentAssets");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
  const [filename, setFilename] = useState(asset.filename);
  const [folder, setFolder] = useState(asset.folder);
  const [secureUrl, setSecureUrl] = useState(asset.secureUrl);
  const [format, setFormat] = useState<string | null>(asset.format);
  const [bytes, setBytes] = useState(asset.bytes);
  const [tags, setTags] = useState<string[]>(asset.tags);

  const displayFormat = format ?? extractExtension(filename) ?? null;

  const FileIcon = formatToIcon(displayFormat);

  useEffect(() => {
    if (!isCopied) return;

    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  useEffect(() => {
    setFilename(asset.filename);
  }, [asset.filename]);

  useEffect(() => {
    setFolder(asset.folder);
  }, [asset.folder]);

  useEffect(() => {
    setSecureUrl(asset.secureUrl);
  }, [asset.secureUrl]);

  useEffect(() => {
    setFormat(asset.format);
  }, [asset.format]);

  useEffect(() => {
    setBytes(asset.bytes);
  }, [asset.bytes]);

  useEffect(() => {
    setTags(asset.tags);
  }, [asset.tags]);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex aspect-video items-center justify-center bg-muted/40">
          <FileIcon className="h-10 w-10 text-muted-foreground" />
        </div>

        <CardHeader className="space-y-2">
          <CardTitle className="truncate text-sm" title={filename}>
            {filename}
          </CardTitle>
          <CardDescription className="truncate text-xs" title={folder}>
            {t("assetCard.folderLabel")}: {folder}
          </CardDescription>
          <AssetTags tags={tags} />
        </CardHeader>

        <CardContent className="flex items-center justify-between gap-3 pt-0">
          <Badge variant="outline">
            {(displayFormat ?? t("common.unknown")).toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatBytes(bytes)}
          </span>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-2 pt-0">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setIsTagsModalOpen(true)}
            aria-label={t("assetCard.renameAsset")}
            title={t("assetCard.renameAsset")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(secureUrl);
              setIsCopied(true);
              toast.success(t("assetCard.copied"));
            }}
            aria-label={
              isCopied ? t("assetCard.copied") : t("assetCard.copyUrl")
            }
            title={isCopied ? t("assetCard.copied") : t("assetCard.copyUrl")}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() =>
              downloadAsset(secureUrl, asset.originalFilename ?? asset.publicId)
            }
            aria-label={t("downloadAsset")}
            title={t("downloadAsset")}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setIsReplaceModalOpen(true)}
            aria-label={t("replaceAsset")}
            title={t("replaceAsset")}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setIsMoveFolderOpen(true)}
            aria-label={t("assetCard.moveToFolder")}
            title={t("assetCard.moveToFolder")}
          >
            <FolderInput className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            disabled={isDeleting}
            aria-label={t("assetCard.deleteAsset")}
            title={t("assetCard.deleteAsset")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>

      <ConfirmationDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          if (isDeleting) return;
          setIsDeleting(true);
          void onDelete(asset.id).finally(() => {
            setIsDeleting(false);
            setIsDeleteOpen(false);
          });
        }}
        title={t("confirmationDialog.deleteConfirmTitle")}
        description={t("confirmationDialog.deleteConfirmBody")}
        confirmText={
          isDeleting
            ? t("confirmationDialog.deleting")
            : t("confirmationDialog.confirm")
        }
        cancelText={t("confirmationDialog.cancel")}
        confirmVariant="destructive"
      />

      <AssetEditTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        asset={{
          id: asset.id,
          filename,
          secureUrl,
          resourceType: "raw",
          tags,
        }}
        onSave={async (id, payload) => {
          const updated = await onEditAsset(id, payload);
          setFilename(updated.filename);
          setTags(updated.tags);
          return updated;
        }}
      />

      <AssetReplaceModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        asset={{
          id: asset.id,
          filename,
          secureUrl,
          resourceType: "raw",
        }}
        onReplaced={(updated) => {
          setSecureUrl(updated.secureUrl);
          setFormat(updated.format);
          setBytes(updated.bytes);
          setTags(updated.tags);
          onReplaceAsset(updated);
        }}
      />

      <AssetMoveFolderModal
        isOpen={isMoveFolderOpen}
        onClose={() => setIsMoveFolderOpen(false)}
        asset={{
          id: asset.id,
          filename,
          secureUrl,
          folder,
          resourceType: asset.resourceType,
        }}
        onMoved={(updated) => {
          setFolder(updated.folder);
          setSecureUrl(updated.secureUrl);
          onReplaceAsset(updated);
        }}
      />
    </>
  );
}
