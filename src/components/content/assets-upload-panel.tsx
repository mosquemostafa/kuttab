"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { useUploadQueue } from "@/hooks/use-upload-queue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssetsDropzone } from "@/components/content/assets-dropzone";
import { AssetsFileDropzone } from "@/components/content/assets-file-dropzone";
import { AssetsUploadQueue } from "@/components/content/assets-upload-queue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PREDEFINED_FILE_FOLDERS,
  PREDEFINED_FOLDERS,
} from "@/shared/constants/assets.constants";

type AssetsUploadPanelProps = {
  assetType: "image" | "file";
  onUploadCompleted?: () => void;
};

export function AssetsUploadPanel({
  assetType,
  onUploadCompleted,
}: AssetsUploadPanelProps) {
  const t = useTranslations("contentAssets");
  const {
    state,
    addFiles,
    startAll,
    retryFile,
    cancelFile,
    removeFile,
    updateTags,
  } = useUploadQueue();
  const notifiedDoneIdsRef = useRef<Set<string>>(new Set());
  const notifiedErrorIdsRef = useRef<Set<string>>(new Set());
  const folderOptions =
    assetType === "image" ? PREDEFINED_FOLDERS : PREDEFINED_FILE_FOLDERS;
  const [selectedFolder, setSelectedFolder] = useState<string>(
    folderOptions[0],
  );

  const pendingCount = useMemo(
    () => state.filter((item) => item.status === "pending").length,
    [state],
  );

  useEffect(() => {
    setSelectedFolder(folderOptions[0]);
  }, [assetType, folderOptions]);

  const addImageFiles = (files: File[]) =>
    addFiles(files, "image", selectedFolder);
  const addFileFiles = (files: File[]) =>
    addFiles(files, "file", selectedFolder);

  const panelTitle =
    assetType === "image" ? t("panel.imagesTitle") : t("panel.filesTitle");
  const panelDescription =
    assetType === "image"
      ? t("panel.imagesDescription")
      : t("panel.filesDescription");

  useEffect(() => {
    if (!onUploadCompleted) return;

    let hasNewCompletion = false;

    state.forEach((item) => {
      if (item.status !== "done") return;
      if (notifiedDoneIdsRef.current.has(item.id)) return;

      notifiedDoneIdsRef.current.add(item.id);
      hasNewCompletion = true;
    });

    if (hasNewCompletion) {
      onUploadCompleted();
    }
  }, [onUploadCompleted, state]);

  useEffect(() => {
    state.forEach((item) => {
      if (item.status === "done") {
        if (notifiedDoneIdsRef.current.has(item.id)) {
          return;
        }

        notifiedDoneIdsRef.current.add(item.id);
        toast.success(t("toasts.uploadSuccess", { filename: item.file.name }));
        return;
      }

      if (item.status === "error") {
        if (notifiedErrorIdsRef.current.has(item.id)) {
          return;
        }

        notifiedErrorIdsRef.current.add(item.id);
        toast.error(item.error ?? t("toasts.uploadFailed"));
        return;
      }

      notifiedErrorIdsRef.current.delete(item.id);
    });
  }, [state, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{panelTitle}</CardTitle>
        <CardDescription>{panelDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <p className="text-sm font-medium">{t("panel.uploadFolderLabel")}</p>
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-full md:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {folderOptions.map((folder) => (
                <SelectItem key={folder} value={folder}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {assetType === "image" ? (
          <AssetsDropzone addFiles={addImageFiles} />
        ) : (
          <AssetsFileDropzone addFiles={addFileFiles} />
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("queue.filesInQueue", { count: state.length })}
          </p>
          <Button
            type="button"
            onClick={() => {
              void startAll();
            }}
            disabled={pendingCount === 0}
          >
            {t("uploadActions.upload")}
          </Button>
        </div>

        <AssetsUploadQueue
          items={state}
          onRetry={(id) => retryFile(id)}
          onCancel={cancelFile}
          onRemove={removeFile}
          onUpdateTags={updateTags}
          autoCollapse
        />
      </CardContent>
    </Card>
  );
}
