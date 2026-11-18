"use client";

import { useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  locale: Locale;
  min?: string;
  max?: string;
  disabled?: boolean;
  isDateDisabled?: (date: Date) => boolean;
  invalid?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  container?: HTMLElement | null;
  className?: string;
  formatString?: string;
}

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  ariaLabel,
  locale,
  min,
  max,
  disabled = false,
  isDateDisabled,
  invalid = false,
  allowClear = false,
  clearLabel,
  container,
  className,
  formatString = "PPP",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = useMemo(() => toDate(value), [value]);
  const minDate = useMemo(() => toDate(min), [min]);
  const maxDate = useMemo(() => toDate(max), [max]);
  const isRtl = locale.code?.toLowerCase().startsWith("ar");

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          data-empty={!selectedDate}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={invalid}
          className={cn(
            "w-full justify-start font-normal data-[empty=true]:text-muted-foreground",
            className,
          )}
        >
          <CalendarDays data-icon="inline-start" />
          <span className="truncate">
            {selectedDate
              ? format(selectedDate, formatString, { locale })
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto gap-0 p-0"
        container={container}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setIsOpen(false);
          }}
          disabled={(date) =>
            Boolean(
              (minDate && date < minDate) ||
              (maxDate && date > maxDate) ||
              isDateDisabled?.(date),
            )
          }
          locale={locale}
          dir={isRtl ? "rtl" : "ltr"}
          initialFocus
        />
        {allowClear && selectedDate && clearLabel ? (
          <>
            <Separator />
            <div className="p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
              >
                {clearLabel}
              </Button>
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
