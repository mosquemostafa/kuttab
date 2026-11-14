"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { File, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import {
  fetchReplaceSignature,
  finalizeReplace,
  uploadToCloudinary,
} from "@/lib/assets/upload";
import type { AssetResponseDto } from "@/server/modules/assets/asset.dto";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AssetReplaceModalProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    filename: string;
    secureUrl: string;
    resourceType: "image" | "raw";
  };
  onReplaced: (updated: AssetResponseDto) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isTypeMismatch(file: File, resourceType: "image" | "raw"): boolean {
  const mimeType = (file.type ?? "").toLowerCase();

  if (!mimeType) {
    return false;
  }

  if (resourceType === "image") {
    return !mimeType.startsWith("image/");
  }

  return mimeType.startsWith("image/");
}

export function AssetReplaceModal({
  isOpen,
  onClose,
  asset,
  onReplaced,
}: AssetReplaceModalProps) {
  const t = useTranslations("contentAssets");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isReplacing, setIsReplacing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedFile(null);
    setProgress(0);
    setIsReplacing(false);
    setErrorMessage(null);
  }, [isOpen]);

  const progressPercent = useMemo(
    () => Math.max(0, Math.min(100, Math.round(progress * 100))),
    [progress],
  );

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isReplacing) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader className="items-start text-start">
          <AlertDialogTitle>{t("replaceModalTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("replaceModalHint")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            {asset.resourceType === "image" ? (
              <div className="relative size-12 overflow-hidden rounded-md bg-muted">
                <Image
                  src={asset.secureUrl}
                  alt={asset.filename}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <File className="size-5" />
              </div>
            )}
            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium"
                title={asset.filename}
              >
                {asset.filename}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Input
              type="file"
              accept={asset.resourceType === "image" ? "image/*" : undefined}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                setErrorMessage(null);

                if (!file) {
                  return;
                }

                if (isTypeMismatch(file, asset.resourceType)) {
                  setSelectedFile(null);
                  setErrorMessage(t("replaceTypeMismatch"));
                }
              }}
              disabled={isReplacing}
            />
            {selectedFile ? (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({formatBytes(selectedFile.size)})
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {t("replaceModalHint")}
            </p>
          </div>

          {isReplacing ? (
            <div className="grid gap-2">
              <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t("replacingAsset")} ({progressPercent}%)
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isReplacing}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={async () => {
              if (!selectedFile) {
                setErrorMessage(t("replaceFailed"));
                return;
              }

              setIsReplacing(true);
              setErrorMessage(null);
              setProgress(0);

              try {
                const signature = await fetchReplaceSignature(asset.id, {
                  fileName: selectedFile.name,
                  fileSize: selectedFile.size,
                  mimeType: selectedFile.type,
                });

                const uploadResult = await uploadToCloudinary(
                  selectedFile,
                  signature.upload,
                  setProgress,
                );

                const updated = await finalizeReplace(
                  asset.id,
                  uploadResult.public_id,
                );
                onReplaced(updated);
                toast.success(t("replaceSuccess"));
                onClose();
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : t("replaceFailed"),
                );
              } finally {
                setIsReplacing(false);
              }
            }}
            disabled={isReplacing || !selectedFile}
          >
            {isReplacing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("replacingAsset")}
              </>
            ) : (
              t("replaceConfirm")
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
