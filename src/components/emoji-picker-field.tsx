"use client";

import { useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { SmilePlus, X } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type EmojiPickerFieldProps = {
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  pickLabel: string;
  clearLabel: string;
  inDialog?: boolean;
  portalContainer?: HTMLElement | null;
};

export function EmojiPickerField({
  idPrefix,
  value,
  onChange,
  label,
  pickLabel,
  clearLabel,
  inDialog = false,
  portalContainer,
}: EmojiPickerFieldProps) {
  const { resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const triggerId = `${idPrefix}-emoji-trigger`;

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={triggerId}>{label}</Label> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              id={triggerId}
              className={cn(
                "font-normal",
                pickLabel
                  ? "h-11 justify-start gap-2 px-3"
                  : "size-9 justify-center p-0",
                value ? "min-w-9" : "",
              )}
            >
              {value ? (
                <span
                  className={cn(
                    "leading-none",
                    pickLabel
                      ? "text-2xl"
                      : "flex size-full items-center justify-center text-xl",
                  )}
                  role="img"
                >
                  {value}
                </span>
              ) : (
                <>
                  <SmilePlus
                    className={cn(
                      "shrink-0 opacity-70",
                      pickLabel ? "size-4" : "size-5",
                    )}
                  />
                  {pickLabel}
                </>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="center"
            side="bottom"
            sideOffset={6}
            container={portalContainer ?? undefined}
            onFocusOutside={(e) => e.preventDefault()}
            className={cn(
              "w-auto border-0 bg-transparent p-0 shadow-xl",
              inDialog ? "z-200" : "z-100",
            )}
          >
            <div dir="ltr">
              <Picker
                data={data}
                theme={resolvedTheme ?? "auto"}
                exceptEmojis={[
                  "flag-il",
                  "rainbow",
                  "rainbow-flag",
                  "transgender_flag",
                  "beer",
                  "beers",
                  "wine_glass",
                  "cocktail",
                  "tropical_drink",
                  "champagne",
                  "cigarette",
                  "pill",
                  "syringe",
                  "gun",
                  "knife",
                  "dagger_knife",
                  "bomb",
                  "skull",
                  "skull_and_crossbones",
                  "eggplant",
                  "peach",
                  "tongue",
                  "lips",
                  "kiss",
                  "slot_machine",
                  "game_die",
                  "dart",
                  "middle_finger",
                  "clown_face",
                  "pile_of_poo",
                  "coffin",
                  "headstone",
                  "funeral_urn",
                ]}
                onEmojiSelect={(emoji: { native: string }) => {
                  onChange(emoji.native);
                  setOpen(false);
                }}
                autoFocus
              />
            </div>
          </PopoverContent>
        </Popover>

        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => onChange("")}
            aria-label={clearLabel}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
