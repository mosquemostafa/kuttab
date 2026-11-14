"use client";

import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { TagLabel } from "@/components/ui/hash-tag-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 32;

type AssetTagEditorProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
};

function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
}

export function AssetTagEditor({
  value,
  onChange,
  disabled = false,
}: AssetTagEditorProps) {
  const t = useTranslations("contentAssets");
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedExisting = useMemo(
    () => new Set(value.map((tag) => normalizeTag(tag))),
    [value],
  );

  const canAddMore = value.length < MAX_TAGS;

  const addTag = (rawTag: string) => {
    const normalized = normalizeTag(rawTag);

    if (!normalized) {
      setErrorMessage(t("tags.errors.empty"));
      return;
    }

    if (normalized.length > MAX_TAG_LENGTH) {
      setErrorMessage(t("tags.errors.maxLength", { max: MAX_TAG_LENGTH }));
      return;
    }

    if (!canAddMore) {
      setErrorMessage(t("tags.errors.maxCount", { max: MAX_TAGS }));
      return;
    }

    if (normalizedExisting.has(normalized)) {
      setErrorMessage(t("tags.errors.duplicate"));
      return;
    }

    onChange([...value, normalized]);
    setInputValue("");
    setErrorMessage(null);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    addTag(inputValue);
  };

  const onInputChange = (nextValue: string) => {
    if (disabled) {
      return;
    }

    if (nextValue.includes(",")) {
      const [firstTag] = nextValue.split(",");
      addTag(firstTag ?? "");
      return;
    }

    setInputValue(nextValue);
    setErrorMessage(null);
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) {
      return;
    }

    onChange(value.filter((tag) => tag !== tagToRemove));
    setErrorMessage(null);
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("tags.editorLabel")}</p>
        <span className="text-xs text-muted-foreground">
          {t("tags.count", { count: value.length, max: MAX_TAGS })}
        </span>
      </div>

      <Input
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={onInputKeyDown}
        placeholder={t("tags.inputPlaceholder")}
        disabled={disabled || !canAddMore}
        maxLength={MAX_TAG_LENGTH + 1}
      />

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}

      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              <TagLabel tag={tag} />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-4"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                aria-label={t("tags.removeTagAria", { tag })}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("tags.noTags")}</p>
      )}
    </div>
  );
}
