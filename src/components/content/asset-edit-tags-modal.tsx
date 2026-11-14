"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { AssetTagEditor } from "@/components/content/asset-tag-editor";
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

type AssetEditTagsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    id: string;
    filename: string;
    secureUrl: string;
    resourceType: "image" | "raw";
    tags: string[];
  };
  onSave: (
    id: string,
    payload: { filename: string; tags: string[] },
  ) => Promise<{ filename: string; tags: string[] }>;
};

export function AssetEditTagsModal({
  isOpen,
  onClose,
  asset,
  onSave,
}: AssetEditTagsModalProps) {
  const t = useTranslations("contentAssets");
  const [draftFilename, setDraftFilename] = useState(asset.filename);
  const [draftTags, setDraftTags] = useState<string[]>(asset.tags);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftFilename(asset.filename);
    setDraftTags(asset.tags);
    setErrorMessage(null);
  }, [asset.filename, asset.tags, isOpen]);

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
          <AlertDialogTitle>{t("tags.editModalTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("tags.editModalDescription")}
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
            </div>
          </div>

          <AssetTagEditor
            value={draftTags}
            onChange={setDraftTags}
            disabled={isSaving}
          />

          <div className="grid gap-2">
            <p className="text-sm font-medium">{t("assetCard.renameAsset")}</p>
            <Input
              value={draftFilename}
              onChange={(event) => setDraftFilename(event.target.value)}
              placeholder={t("assetCard.filenamePlaceholder")}
              maxLength={255}
              disabled={isSaving}
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </div>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={async () => {
              setIsSaving(true);
              setErrorMessage(null);

              try {
                const nextFilename = draftFilename.trim();

                if (!nextFilename) {
                  setErrorMessage(t("errors.renameFailed"));
                  setIsSaving(false);
                  return;
                }

                await onSave(asset.id, {
                  filename: nextFilename,
                  tags: draftTags,
                });
                onClose();
              } catch (error) {
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : t("errors.updateTagsFailed"),
                );
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
          >
            {isSaving ? t("tags.saving") : t("tags.save")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
