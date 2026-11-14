"use client";

import { useState } from "react";
import { Palette } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  COLOR_KEYS,
  PALETTE_UNTINTED_SWATCH_BUTTON_CLASS,
  paletteSwatchButtonBorderClasses,
  paletteSwatchFillClass,
  projectColorKeyToIconTextClass,
  type ColorKey,
} from "@/shared/constants/color-palette";

function PaletteSwatchGrid({
  value,
  onSelect,
}: {
  value: ColorKey | null;
  onSelect: (key: ColorKey | null) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        title="default"
        aria-label="No tint"
        className={cn(
          "size-6 rounded-full border transition-transform hover:scale-105",
          PALETTE_UNTINTED_SWATCH_BUTTON_CLASS,
          value === null &&
            "ring-2 ring-primary ring-offset-2 ring-offset-popover",
        )}
      >
        <span className="sr-only">No tint</span>
      </button>
      {COLOR_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          title={key}
          aria-label={key}
          className={cn(
            "size-6 rounded-full border transition-transform hover:scale-105",
            paletteSwatchButtonBorderClasses(key),
            paletteSwatchFillClass(key),
            value === key &&
              "ring-2 ring-primary ring-offset-2 ring-offset-popover",
          )}
        >
          <span className="sr-only">{key}</span>
        </button>
      ))}
    </div>
  );
}

type PaletteColorPickerProps = {
  mode?: "icon" | "input";
  value: ColorKey | null;
  onChange: (next: ColorKey | null) => void | Promise<void>;
  disabled?: boolean;
  /** For icon mode: merged with default trigger sizing (`size-8 shrink-0`). */
  triggerClassName?: string;
  /** For input mode: full-width button classes. */
  inputClassName?: string;
  align?: "start" | "center" | "end";
  title?: string;
  triggerAriaLabel?: string;
  /** Input mode label for null/default color. */
  inputNoneLabel?: string;
  /** Input mode label resolver for color keys. */
  getColorLabel?: (key: ColorKey) => string;
  /** Icon mode visual options (useful for tinted cards). */
  dimmed?: boolean;
  size?: "compact" | "comfortable";
  className?: string;
  tintedSurface?: boolean;
};

export function PaletteColorPicker({
  mode = "icon",
  value,
  onChange,
  disabled,
  triggerClassName,
  inputClassName,
  align = "end",
  title,
  triggerAriaLabel,
  inputNoneLabel,
  getColorLabel,
  dimmed,
  size = "compact",
  className,
  tintedSurface,
}: PaletteColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const isCompact = size === "compact";
  const selectedIconTextClass = projectColorKeyToIconTextClass(value);

  const iconTriggerBtnClass = cn(
    "inline-flex max-w-full min-w-0 cursor-pointer items-center rounded-md font-medium outline-none transition-colors",
    tintedSurface
      ? "hover:bg-black/10 hover:text-inherit"
      : "hover:bg-muted hover:text-foreground",
    isCompact
      ? "px-1 py-0.5 text-[10px] sm:rounded-lg sm:px-2 sm:py-1 sm:text-sm"
      : "rounded-lg px-2 py-1 text-sm",
    className,
  );

  const iconTriggerPaletteClass = cn(
    isCompact ? "size-2.5 shrink-0 sm:size-3.5" : "size-3.5 shrink-0",
    tintedSurface ? "text-current/75" : "text-muted-foreground",
    !tintedSurface && dimmed && "text-muted-foreground",
    tintedSurface && dimmed && "opacity-70",
    selectedIconTextClass,
  );

  const useOutlinedIconButton =
    mode === "icon" &&
    !className &&
    tintedSurface === undefined &&
    !dimmed &&
    size === "compact";

  const inputValueLabel =
    value === null
      ? (inputNoneLabel ?? "default")
      : (getColorLabel?.(value) ?? value);

  const applyChange = async (key: ColorKey | null) => {
    if (key === value) {
      setOpen(false);
      return;
    }
    setPending(true);
    try {
      await onChange(key);
    } finally {
      setPending(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {mode === "input" ? (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-9 w-full min-w-0 justify-between px-3",
              inputClassName,
            )}
            title={title ?? inputValueLabel}
            aria-label={triggerAriaLabel ?? `Color: ${inputValueLabel}`}
            disabled={disabled || pending}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "size-3.5 shrink-0 rounded-full border",
                  value !== null && paletteSwatchButtonBorderClasses(value),
                  value !== null && paletteSwatchFillClass(value),
                  value === null && PALETTE_UNTINTED_SWATCH_BUTTON_CLASS,
                )}
                aria-hidden
              />
              <span className="truncate text-start">{inputValueLabel}</span>
            </span>
            <Palette
              className={cn(
                "size-4 shrink-0 text-muted-foreground",
                selectedIconTextClass,
              )}
              aria-hidden
            />
          </Button>
        ) : useOutlinedIconButton ? (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className={cn("size-8 shrink-0", triggerClassName)}
            title={title ?? value ?? "default"}
            aria-label={triggerAriaLabel ?? `Color: ${value ?? "default"}`}
            disabled={disabled || pending}
          >
            <Palette
              className={cn(
                "size-4 text-muted-foreground",
                selectedIconTextClass,
              )}
              aria-hidden
            />
          </Button>
        ) : (
          <button
            type="button"
            className={iconTriggerBtnClass}
            aria-label={triggerAriaLabel ?? `Color: ${value ?? "default"}`}
            title={title ?? value ?? "default"}
            disabled={disabled || pending}
          >
            <Palette className={iconTriggerPaletteClass} aria-hidden />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-2">
        <PaletteSwatchGrid
          value={value}
          onSelect={(key) => {
            void applyChange(key);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
