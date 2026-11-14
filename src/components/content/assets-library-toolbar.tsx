"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FILE_FORMAT_FILTERS,
  IMAGE_FORMAT_FILTERS,
  PREDEFINED_FILE_FOLDERS,
  PREDEFINED_FOLDERS,
} from "@/shared/constants/assets.constants";
import { apiClient } from "@/lib/api/api-client";

const SEARCH_DEBOUNCE_MS = 300;
const ALL_OPTION = "all";

export type AssetsLibraryToolbarFilters = {
  q?: string;
  folder?: string;
  format?: string;
  tag?: string;
  resourceType?: "image" | "raw";
};

type AssetsLibraryToolbarProps = {
  value?: AssetsLibraryToolbarFilters;
  onChange: (filters: AssetsLibraryToolbarFilters) => void;
  disabled?: boolean;
  lockedResourceType?: "image" | "raw";
};

export function AssetsLibraryToolbar({
  value,
  onChange,
  disabled = false,
  lockedResourceType,
}: AssetsLibraryToolbarProps) {
  const t = useTranslations("contentAssets");
  const [searchInput, setSearchInput] = useState(value?.q ?? "");
  const [folder, setFolder] = useState<string>(value?.folder ?? ALL_OPTION);
  const [format, setFormat] = useState<string>(value?.format ?? ALL_OPTION);
  const [tag, setTag] = useState<string>(value?.tag ?? "");
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [resourceType, setResourceType] = useState<string>(
    lockedResourceType ?? value?.resourceType ?? ALL_OPTION,
  );

  useEffect(() => {
    setSearchInput(value?.q ?? "");
    setFolder(value?.folder ?? ALL_OPTION);
    setFormat(value?.format ?? ALL_OPTION);
    setTag(value?.tag ?? "");
    setResourceType(lockedResourceType ?? value?.resourceType ?? ALL_OPTION);
  }, [
    lockedResourceType,
    value?.q,
    value?.folder,
    value?.format,
    value?.tag,
    value?.resourceType,
  ]);

  useEffect(() => {
    let active = true;

    const loadTagSuggestions = async () => {
      try {
        const tagsData = await apiClient.contentAssets.listTags();

        if (!active) {
          return;
        }

        setTagSuggestions(Array.isArray(tagsData?.tags) ? tagsData.tags : []);
      } catch {
        if (!active) {
          return;
        }

        setTagSuggestions([]);
      }
    };

    void loadTagSuggestions();

    return () => {
      active = false;
    };
  }, []);

  const effectiveResourceType = lockedResourceType ?? resourceType;

  const folderOptions = useMemo(() => {
    if (effectiveResourceType === "image") {
      return PREDEFINED_FOLDERS;
    }

    if (effectiveResourceType === "raw") {
      return PREDEFINED_FILE_FOLDERS;
    }

    return Array.from(
      new Set([...PREDEFINED_FOLDERS, ...PREDEFINED_FILE_FOLDERS]),
    );
  }, [effectiveResourceType]);

  const formatOptions = useMemo(() => {
    if (effectiveResourceType === "image") {
      return IMAGE_FORMAT_FILTERS;
    }

    if (effectiveResourceType === "raw") {
      return FILE_FORMAT_FILTERS;
    }

    return Array.from(
      new Set([...IMAGE_FORMAT_FILTERS, ...FILE_FORMAT_FILTERS]),
    );
  }, [effectiveResourceType]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      onChange({
        q: trimmed.length > 0 ? trimmed : undefined,
        folder: folder !== ALL_OPTION ? folder : undefined,
        format: format !== ALL_OPTION ? format : undefined,
        tag: tag.trim().length > 0 ? tag.trim().toLowerCase() : undefined,
        resourceType:
          effectiveResourceType !== ALL_OPTION
            ? (effectiveResourceType as "image" | "raw")
            : undefined,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput, folder, format, tag, effectiveResourceType, onChange]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchInput.trim().length > 0 ||
      folder !== ALL_OPTION ||
      format !== ALL_OPTION ||
      tag.trim().length > 0 ||
      effectiveResourceType !== ALL_OPTION
    );
  }, [searchInput, folder, format, tag, effectiveResourceType]);

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_200px_160px_minmax(0,1fr)_auto] md:items-center">
      <Input
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder={t("toolbar.searchPlaceholder")}
        disabled={disabled}
      />

      <Select
        value={effectiveResourceType}
        onValueChange={(nextValue) => {
          if (lockedResourceType) {
            return;
          }

          setResourceType(nextValue);
          setFolder(ALL_OPTION);
          setFormat(ALL_OPTION);
        }}
        disabled={disabled || Boolean(lockedResourceType)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("toolbar.filterByResourceType")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_OPTION}>
            {t("toolbar.resourceTypeAll")}
          </SelectItem>
          <SelectItem value="image">
            {t("toolbar.resourceTypeImages")}
          </SelectItem>
          <SelectItem value="raw">{t("toolbar.resourceTypeFiles")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={folder} onValueChange={setFolder} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("toolbar.filterByFolder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_OPTION}>{t("toolbar.allFolders")}</SelectItem>
          {folderOptions.map((folderOption) => (
            <SelectItem key={folderOption} value={folderOption}>
              {folderOption}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={format} onValueChange={setFormat} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("toolbar.filterByFormat")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_OPTION}>{t("toolbar.allFormats")}</SelectItem>
          {formatOptions.map((formatOption) => (
            <SelectItem key={formatOption} value={formatOption}>
              {formatOption.toUpperCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={tag}
        onChange={(event) => setTag(event.target.value)}
        placeholder={t("toolbar.filterByTag")}
        list="assets-tags-suggestions"
        disabled={disabled}
      />

      <datalist id="assets-tags-suggestions">
        {tagSuggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setSearchInput("");
          setFolder(ALL_OPTION);
          setFormat(ALL_OPTION);
          setTag("");
          if (!lockedResourceType) {
            setResourceType(ALL_OPTION);
          }

          onChange(
            lockedResourceType ? { resourceType: lockedResourceType } : {},
          );
        }}
        disabled={disabled || !hasActiveFilters}
      >
        {t("toolbar.clearFilters")}
      </Button>
    </div>
  );
}
