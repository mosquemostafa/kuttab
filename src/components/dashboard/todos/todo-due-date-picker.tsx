"use client";

import { addDays, addMonths, isSameDay, startOfDay } from "date-fns";
import { CalendarPlus2, Moon, Sun, Sunrise } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { arSA, enUS } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TodoDueDatePickerProps = {
  value?: Date;
  onSave: (nextDate?: Date) => void | Promise<void>;
  trigger: ReactNode;
  align?: "start" | "center" | "end";
};

export function TodoDueDatePicker({
  value,
  onSave,
  trigger,
  align = "end",
}: TodoDueDatePickerProps) {
  const t = useTranslations("todos");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(value);

  const semanticDates = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      today,
      tomorrow: startOfDay(addDays(today, 1)),
      nextWeek: startOfDay(addDays(today, 7)),
      nextMonth: startOfDay(addMonths(today, 1)),
    };
  }, []);

  const isArabicLocale = locale.toLowerCase().startsWith("ar");
  const calendarLocale = isArabicLocale ? arSA : enUS;
  const calendarDir = isArabicLocale ? "rtl" : "ltr";

  const isPresetActive = (presetDate: Date) =>
    Boolean(draftDate && isSameDay(draftDate, presetDate));

  const saveDate = async (nextDate?: Date) => {
    setIsSaving(true);
    try {
      setDraftDate(nextDate);
      await onSave(nextDate);
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setDraftDate(value);
        }
      }}
    >
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-2">
        <div className="flex justify-center">
          <DateCalendar
            mode="single"
            selected={draftDate}
            onSelect={setDraftDate}
            locale={calendarLocale}
            dir={calendarDir}
          />
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant={
                isPresetActive(semanticDates.today) ? "default" : "outline"
              }
              title={t("labels.today")}
              aria-label={t("labels.today")}
              onClick={() => {
                void saveDate(semanticDates.today);
              }}
              disabled={isSaving}
            >
              <Sun />
            </Button>
            <span
              className={
                isPresetActive(semanticDates.today)
                  ? "text-[10px] leading-none font-medium text-foreground"
                  : "text-[10px] leading-none text-muted-foreground"
              }
            >
              {t("labels.today")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant={
                isPresetActive(semanticDates.tomorrow) ? "default" : "outline"
              }
              title={t("labels.tomorrow")}
              aria-label={t("labels.tomorrow")}
              onClick={() => {
                void saveDate(semanticDates.tomorrow);
              }}
              disabled={isSaving}
            >
              <Sunrise />
            </Button>
            <span
              className={
                isPresetActive(semanticDates.tomorrow)
                  ? "text-[10px] leading-none font-medium text-foreground"
                  : "text-[10px] leading-none text-muted-foreground"
              }
            >
              {t("labels.tomorrow")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant={
                isPresetActive(semanticDates.nextWeek) ? "default" : "outline"
              }
              title={t("labels.nextWeek")}
              aria-label={t("labels.nextWeek")}
              onClick={() => {
                void saveDate(semanticDates.nextWeek);
              }}
              disabled={isSaving}
            >
              <CalendarPlus2 />
            </Button>
            <span
              className={
                isPresetActive(semanticDates.nextWeek)
                  ? "text-[10px] leading-none font-medium text-foreground"
                  : "text-[10px] leading-none text-muted-foreground"
              }
            >
              {t("labels.nextWeek")}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant={
                isPresetActive(semanticDates.nextMonth) ? "default" : "outline"
              }
              title={t("labels.nextMonth")}
              aria-label={t("labels.nextMonth")}
              onClick={() => {
                void saveDate(semanticDates.nextMonth);
              }}
              disabled={isSaving}
            >
              <Moon />
            </Button>
            <span
              className={
                isPresetActive(semanticDates.nextMonth)
                  ? "text-[10px] leading-none font-medium text-foreground"
                  : "text-[10px] leading-none text-muted-foreground"
              }
            >
              {t("labels.nextMonth")}
            </span>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void saveDate(undefined);
            }}
            disabled={isSaving}
          >
            {t("actions.clear")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving}
            onClick={() => {
              void saveDate(draftDate);
            }}
          >
            {t("actions.confirm")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
