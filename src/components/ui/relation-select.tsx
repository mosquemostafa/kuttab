"use client";

import * as React from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestWithMeta } from "@/lib/api/api-core";
import { cn } from "@/lib/utils";
import type { SelectNameItem } from "@/shared/types/select.types";

type SelectQueryValue = string | number | boolean | null | undefined;

interface InternalOption<TOption extends SelectNameItem> {
  id: string;
  label: string;
  option: TOption | null;
}

function defaultGetOptionLabel<TOption extends SelectNameItem>(
  option: TOption,
) {
  return option.name;
}

export interface RelationSelectProps<
  TOption extends SelectNameItem = SelectNameItem,
> {
  endpoint: string;
  value: string;
  onValueChange: (value: string, option: TOption | null) => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  enabled?: boolean;
  className?: string;
  contentClassName?: string;
  container?: HTMLElement | null;
  query?: Record<string, SelectQueryValue>;
  limit?: number;
  debounceMs?: number;
  emptyOption?: { value: string; label: string };
  selectedOption?: TOption | null;
  getOptionLabel?: (option: TOption) => string;
  renderOption?: (option: TOption) => React.ReactNode;
  onOptionsChange?: (options: TOption[]) => void;
}

function buildSelectUrl(
  endpoint: string,
  search: string,
  limit: number,
  query?: Record<string, SelectQueryValue>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) params.set("q", trimmedSearch);
  params.set("limit", String(limit));

  return `${endpoint}${endpoint.includes("?") ? "&" : "?"}${params.toString()}`;
}

export function RelationSelect<
  TOption extends SelectNameItem = SelectNameItem,
>({
  endpoint,
  value,
  onValueChange,
  placeholder,
  id,
  disabled = false,
  invalid = false,
  enabled = true,
  className,
  contentClassName,
  container,
  query,
  limit = 100,
  debounceMs = 300,
  emptyOption,
  selectedOption,
  getOptionLabel = defaultGetOptionLabel,
  renderOption,
  onOptionsChange,
}: RelationSelectProps<TOption>) {
  const t = useTranslations("common.relationSelect");
  const locale = useLocale();
  const emptyOptionValue = emptyOption?.value;
  const emptyOptionLabel = emptyOption?.label;
  const [inputValue, setInputValue] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [knownOptions, setKnownOptions] = React.useState(
    () => new Map<string, TOption>(),
  );

  React.useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(inputValue),
      debounceMs,
    );

    return () => window.clearTimeout(timer);
  }, [debounceMs, inputValue]);

  const queryKey = JSON.stringify(
    Object.entries(query ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  );
  const selectUrl = React.useMemo(
    () => buildSelectUrl(endpoint, debouncedSearch, limit, query),
    // queryKey is the stable, value-based dependency for the query object.
    [debouncedSearch, endpoint, limit, queryKey],
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? selectUrl : null,
    (url) => requestWithMeta<TOption>(url),
    { revalidateOnFocus: false },
  );

  React.useEffect(() => {
    const incomingOptions = [
      ...(selectedOption ? [selectedOption] : []),
      ...(data?.items ?? []),
    ];
    if (incomingOptions.length === 0) return;

    setKnownOptions((current) => {
      const next = new Map(current);
      let changed = false;

      for (const option of incomingOptions) {
        if (next.get(option.id) !== option) {
          next.set(option.id, option);
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [data?.items, selectedOption]);

  const availableOptions = React.useMemo(
    () => Array.from(knownOptions.values()),
    [knownOptions],
  );

  React.useEffect(() => {
    onOptionsChange?.(availableOptions);
  }, [availableOptions, onOptionsChange]);

  const internalOptions = React.useMemo<InternalOption<TOption>[]>(
    () => [
      ...(emptyOptionValue && emptyOptionLabel
        ? [
            {
              id: emptyOptionValue,
              label: emptyOptionLabel,
              option: null,
            },
          ]
        : []),
      ...availableOptions.map((option) => ({
        id: option.id,
        label: getOptionLabel(option),
        option,
      })),
    ],
    [availableOptions, emptyOptionLabel, emptyOptionValue, getOptionLabel],
  );

  const visibleOptions = React.useMemo<InternalOption<TOption>[]>(
    () => [
      ...(!debouncedSearch.trim() && emptyOptionValue && emptyOptionLabel
        ? [
            {
              id: emptyOptionValue,
              label: emptyOptionLabel,
              option: null,
            },
          ]
        : []),
      ...(data?.items ?? []).map((option) => ({
        id: option.id,
        label: getOptionLabel(option),
        option,
      })),
    ],
    [
      data?.items,
      debouncedSearch,
      emptyOptionLabel,
      emptyOptionValue,
      getOptionLabel,
    ],
  );

  const items = React.useMemo(
    () =>
      Combobox.createItems(internalOptions, {
        getValue: (option) => option.id,
        getLabel: (option) => option.label,
      }),
    [internalOptions],
  );

  return (
    <Combobox.Root
      items={items}
      filteredItems={visibleOptions}
      value={value || null}
      onValueChange={(nextValue) => {
        if (nextValue !== null) {
          onValueChange(nextValue, knownOptions.get(nextValue) ?? null);
        }
        setInputValue("");
      }}
      inputValue={inputValue}
      onInputValueChange={(nextValue, eventDetails) => {
        if (eventDetails.reason !== "item-press") setInputValue(nextValue);
      }}
      onOpenChange={(open) => {
        if (!open) setInputValue("");
      }}
      filter={null}
      autoHighlight
      disabled={disabled || !enabled}
    >
      <Combobox.Trigger
        id={id}
        render={<Button type="button" variant="outline" />}
        aria-invalid={invalid}
        className={cn(
          "w-full justify-between font-normal",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <Combobox.Value placeholder={placeholder} />
        {isValidating ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : (
          <ChevronsUpDownIcon aria-hidden="true" />
        )}
      </Combobox.Trigger>

      <Combobox.Portal container={container ?? undefined}>
        <Combobox.Positioner
          align="start"
          sideOffset={4}
          className="isolate z-50"
        >
          <Combobox.Popup
            aria-label={placeholder}
            aria-busy={isLoading || isValidating}
            className={cn(
              "relative max-h-(--available-height) w-(--anchor-width) min-w-52 origin-(--transform-origin) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              contentClassName,
            )}
            dir={locale.startsWith("ar") ? "rtl" : "ltr"}
          >
            <div className="p-1">
              <Combobox.Input
                render={<Input />}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="h-9"
              />
            </div>

            {isLoading ? (
              <div
                role="status"
                className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground"
              >
                <LoaderCircleIcon className="size-4 animate-spin" />
                {t("loading")}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 px-3 py-5 text-center">
                <p role="alert" className="text-sm text-destructive">
                  {t("loadFailed")}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void mutate()}
                >
                  {t("retry")}
                </Button>
              </div>
            ) : (
              <>
                <Combobox.Empty className="px-3 py-6 text-center text-sm text-muted-foreground empty:p-0">
                  {t("empty")}
                </Combobox.Empty>
                <Combobox.List className="max-h-72 scroll-py-1 overflow-y-auto overscroll-contain p-1">
                  {(item: InternalOption<TOption>) => (
                    <Combobox.Item
                      key={item.id}
                      value={item.id}
                      className="relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pe-8 ps-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                    >
                      <span className="truncate">
                        {item.option && renderOption
                          ? renderOption(item.option)
                          : item.label}
                      </span>
                      <Combobox.ItemIndicator className="pointer-events-none absolute inset-e-2 flex size-4 items-center justify-center">
                        <CheckIcon className="size-4" />
                      </Combobox.ItemIndicator>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
