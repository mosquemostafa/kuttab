"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { moveAssetToFolder } from "@/lib/assets/move";
import {
  PREDEFINED_FILE_FOLDERS,
  PREDEFINED_FOLDERS,
} from "@/shared/constants/assets.constants";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssetResponseDto } from "@/server/modules/assets/asset.dto";

type AssetMoveFolderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    filename: string;
    secureUrl: string;
    folder: string;
    resourceType: "image" | "raw" | "video";
  };
  onMoved: (updated: AssetResponseDto) => void;
};

export function AssetMoveFolderModal({
  isOpen,
  onClose,
  asset,
  onMoved,
}: AssetMoveFolderModalProps) {
  const t = useTranslations("contentAssets");
  const folderOptions = useMemo(() => {
    return asset.resourceType === "raw"
      ? [...PREDEFINED_FILE_FOLDERS]
      : [...PREDEFINED_FOLDERS];
  }, [asset.resourceType]);

  const selectableFolders = useMemo(() => {
    const inList = folderOptions.some((f) => f === asset.folder);
    if (!inList) {
      return folderOptions;
    }
    return folderOptions.filter((f) => f !== asset.folder);
  }, [asset.folder, folderOptions]);

  const [targetFolder, setTargetFolder] = useState<string>(
    () => selectableFolders[0] ?? folderOptions[0] ?? "",
  );
  const [isMoving, setIsMoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setErrorMessage(null);
    const next = selectableFolders[0] ?? folderOptions[0] ?? "";
    setTargetFolder(next);
  }, [asset.folder, asset.id, folderOptions, isOpen, selectableFolders]);

  const canSubmit = targetFolder.length > 0 && selectableFolders.length > 0;

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader className="items-start text-start">
          <AlertDialogTitle>{t("moveFolder.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("moveFolder.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            {asset.resourceType === "image" ||
            asset.resourceType === "video" ? (
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
              <div className="flex size-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                FILE
              </div>
            )}
            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium"
                title={asset.filename}
              >
                {asset.filename}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t("assetCard.folderLabel")}: {asset.folder}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">
              {t("moveFolder.targetLabel")}
            </span>
            <Select
              value={targetFolder}
              onValueChange={setTargetFolder}
              disabled={selectableFolders.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("moveFolder.selectPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {selectableFolders.map((folder) => (
                  <SelectItem key={folder} value={folder}>
                    {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          {selectableFolders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("moveFolder.noOtherFolders")}
            </p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isMoving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || isMoving}
            onClick={() => {
              if (!canSubmit || isMoving) {
                return;
              }

              setIsMoving(true);
              setErrorMessage(null);

              void moveAssetToFolder(asset.id, { folder: targetFolder })
                .then((updated) => {
                  onMoved(updated);
                  toast.success(t("moveFolder.success"));
                  onClose();
                })
                .catch((err: unknown) => {
                  setErrorMessage(
                    err instanceof Error ? err.message : t("moveFolder.failed"),
                  );
                })
                .finally(() => {
                  setIsMoving(false);
                });
            }}
          >
            {isMoving ? t("moveFolder.moving") : t("moveFolder.confirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
