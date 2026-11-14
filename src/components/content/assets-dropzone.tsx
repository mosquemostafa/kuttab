"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type AssetsDropzoneProps = {
  disabled?: boolean;
  addFiles: (files: File[]) => void;
  allowedMimeTypes?: readonly string[];
  maxFileSizeBytes?: number;
};

const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)}MB`;
}

export function AssetsDropzone({
  disabled = false,
  addFiles,
  allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
}: AssetsDropzoneProps) {
  const t = useTranslations("contentAssets");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = allowedMimeTypes.join(",");

  const validateAndAdd = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const nextFiles = Array.from(files);
    const valid: File[] = [];
    const invalidMessages: string[] = [];

    for (const file of nextFiles) {
      if (!allowedMimeTypes.includes(file.type)) {
        invalidMessages.push(
          t("errors.unsupportedType", {
            fileName: file.name,
            fileType: file.type || t("common.unknown"),
          }),
        );
        continue;
      }

      if (file.size > maxFileSizeBytes) {
        invalidMessages.push(
          t("errors.exceedsMaxSize", {
            fileName: file.name,
            maxSize: formatBytes(maxFileSizeBytes),
          }),
        );
        continue;
      }

      valid.push(file);
    }

    if (invalidMessages.length > 0) {
      setError(invalidMessages.join(" | "));
    } else {
      setError(null);
    }

    if (valid.length > 0) {
      addFiles(valid);
    }
  };

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          validateAndAdd(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          if (disabled) return;
          validateAndAdd(event.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          disabled
            ? "cursor-not-allowed border-muted-foreground/30 bg-muted/30 opacity-70"
            : isDragActive
              ? "border-primary bg-primary/5"
              : "border-border"
        }`}
      >
        <UploadCloud className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="mb-3 text-sm text-muted-foreground">
          {disabled
            ? t("uploadActions.uploadDisabled")
            : t("uploadActions.dragDropHint")}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handlePick}
          disabled={disabled}
        >
          {t("uploadActions.uploadFiles")}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
