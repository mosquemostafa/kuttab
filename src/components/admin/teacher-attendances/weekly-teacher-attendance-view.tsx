"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import {
  Check,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/api-client";
import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import type {
  TeacherAttendanceDTO,
  TeacherWeeklyAttendanceDTO,
} from "@/shared/types/teacher-attendance.types";
import { AttendanceDeductionType } from "@/shared/types/teacher-attendance.types";

const SATURDAY = 6;

function getWeekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: SATURDAY });
}

interface WeeklyTeacherAttendanceViewProps {
  workingDays: number[];
}

export function WeeklyTeacherAttendanceView({
  workingDays,
}: WeeklyTeacherAttendanceViewProps) {
  const t = useTranslations("adminTeacherAttendances");
  const locale = useLocale();
  const getErrorMessage = useApiErrorMessage();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;
  const isArabic = locale.startsWith("ar");

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [searchQuery, setSearchQuery] = useState("");
  const operationGenerationRef = useRef<Record<string, number>>({});

  const weekStartString = format(weekStart, "yyyy-MM-dd");
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const activeWeekDays = useMemo(
    () => weekDays.filter((day) => workingDays.includes(day.getDay())),
    [weekDays, workingDays],
  );
  const activeDateStrings = useMemo(
    () => new Set(activeWeekDays.map((day) => format(day, "yyyy-MM-dd"))),
    [activeWeekDays],
  );
  const weeklyGridStyle = useMemo(
    () =>
      ({
        gridTemplateColumns: `minmax(156px, 1.4fr) repeat(${activeWeekDays.length}, minmax(68px, 0.65fr))`,
      }) satisfies CSSProperties,
    [activeWeekDays.length],
  );
  const weeklyGridMinWidth = 156 + activeWeekDays.length * 68;

  const { data, error, isLoading, mutate } = useSWR<
    TeacherWeeklyAttendanceDTO[]
  >(
    `/teacher-attendances/weekly?startDate=${weekStartString}`,
    () =>
      apiClient.teacherAttendances.getWeekly({
        startDate: weekStartString,
      }),
    { revalidateOnFocus: true },
  );

  const records = useMemo(() => data ?? [], [data]);
  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(locale);
    if (!query) return records;
    return records.filter((record) =>
      record.teacherName.toLocaleLowerCase(locale).includes(query),
    );
  }, [locale, records, searchQuery]);

  const optimisticToggle = (
    teacherId: string,
    date: string,
    nextAttended: boolean,
  ) => {
    mutate(
      (previous) =>
        previous?.map((record) =>
          record.teacherId !== teacherId
            ? record
            : {
                ...record,
                days: record.days.map((day) => {
                  if (day.date !== date) return day;

                  const temporaryAttendance: TeacherAttendanceDTO = {
                    id: `temp-${teacherId}-${date}`,
                    teacherId,
                    attendanceDate: date,
                    attendanceDeductionType: null,
                    recordedBy: "",
                    createdAt: new Date().toISOString(),
                  };

                  return {
                    ...day,
                    isAttended: nextAttended,
                    attendance: nextAttended
                      ? (day.attendance ?? temporaryAttendance)
                      : null,
                  };
                }),
              },
        ),
      false,
    );
  };

  const handleToggle = async (
    teacher: TeacherWeeklyAttendanceDTO,
    date: string,
    isAttended: boolean,
  ) => {
    const operationKey = `${teacher.teacherId}:${date}`;
    const operationGeneration =
      (operationGenerationRef.current[operationKey] ?? 0) + 1;
    operationGenerationRef.current[operationKey] = operationGeneration;
    const nextAttended = !isAttended;

    optimisticToggle(teacher.teacherId, date, nextAttended);
    toast.success(
      nextAttended
        ? t("notifications.toggledPresent", { name: teacher.teacherName })
        : t("notifications.toggledAbsent", { name: teacher.teacherName }),
    );

    try {
      await apiClient.teacherAttendances.toggle({
        teacherId: teacher.teacherId,
        attendanceDate: date,
      });
    } catch (toggleError) {
      optimisticToggle(teacher.teacherId, date, isAttended);
      toast.error(
        getErrorMessage(toggleError) || t("notifications.error"),
      );
      return;
    }

    if (operationGenerationRef.current[operationKey] === operationGeneration) {
      await mutate();
    }
  };

  const goToPreviousWeek = () =>
    setWeekStart((current) => subWeeks(current, 1));
  const goToNextWeek = () =>
    setWeekStart((current) => addWeeks(current, 1));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 touch-manipulation"
            onClick={goToPreviousWeek}
            aria-label={t("previousWeek")}
          >
            {isArabic ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          <DatePicker
            value={format(weekStart, "yyyy-MM-dd")}
            onChange={(date) => setWeekStart(getWeekStart(parseISO(date)))}
            placeholder={t("datePickerLabel")}
            ariaLabel={t("datePickerLabel")}
            locale={dateLocale}
            formatString="d MMM yyyy"
            className="h-11 min-w-0 flex-1 justify-start px-3 font-medium tabular-nums sm:min-w-[250px]"
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 touch-manipulation"
            onClick={goToNextWeek}
            aria-label={t("nextWeek")}
          >
            {isArabic ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setWeekStart(getWeekStart(new Date()))}
          className="h-11 w-full touch-manipulation sm:w-auto"
        >
          {t("currentWeek")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t("search")}
          className="h-11 ps-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div
          className="overflow-x-auto overscroll-x-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]"
          tabIndex={0}
          role="region"
          aria-label={t("weeklyView")}
        >
          <div
            dir={isArabic ? "rtl" : "ltr"}
            style={{ minWidth: weeklyGridMinWidth }}
          >
            <div
              className="grid border-b bg-muted/45"
              style={weeklyGridStyle}
            >
              <div className="sticky start-0 z-20 flex items-center border-e bg-muted px-3 py-3 text-sm font-semibold">
                {t("columns.teacher")}
              </div>
              {activeWeekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className="flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-center"
                  >
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {format(day, "EEE", { locale: dateLocale })}
                    </span>
                    <span
                      className={`flex h-8 min-w-8 items-center justify-center rounded-full px-1 text-sm font-bold tabular-nums ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {format(day, "d", { locale: dateLocale })}
                    </span>
                  </div>
                );
              })}
            </div>

            {isLoading ? (
              <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {t("actions.refresh")}...
              </div>
            ) : error ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center">
                <p className="text-sm text-destructive">
                  {getErrorMessage(error) || t("notifications.error")}
                </p>
                <Button variant="outline" size="sm" onClick={() => mutate()}>
                  <RefreshCw className="me-2 h-4 w-4" />
                  {t("actions.refresh")}
                </Button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center">
                <p className="font-semibold">{t("empty.title")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery.trim()
                    ? t("empty.description")
                    : t("empty.weeklyDescription")}
                </p>
              </div>
            ) : (
              filteredRecords.map((teacher) => (
                <div
                  key={teacher.teacherId}
                  className="grid min-h-20 border-b last:border-b-0"
                  style={weeklyGridStyle}
                >
                  <div className="sticky start-0 z-10 flex min-w-0 items-center gap-2.5 border-e bg-card px-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {teacher.teacherName.trim().charAt(0)}
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold">
                      {teacher.teacherName}
                    </span>
                  </div>

                  {teacher.days
                    .filter((day) => activeDateStrings.has(day.date))
                    .map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-center px-2 py-3"
                      >
                        <button
                          type="button"
                          aria-pressed={day.isAttended}
                          aria-label={`${teacher.teacherName}, ${format(
                            new Date(`${day.date}T00:00:00`),
                            "EEEE, d MMMM",
                            { locale: dateLocale },
                          )}: ${
                            day.isAttended
                              ? t("statusLabels.present")
                              : t("statusLabels.absent")
                          }`}
                          title={
                            day.isAttended
                              ? t("statusLabels.present")
                              : t("statusLabels.absent")
                          }
                          onClick={() =>
                            handleToggle(teacher, day.date, day.isAttended)
                          }
                          className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-[background-color,border-color,color] md:h-11 md:w-11 ${
                              day.attendance?.attendanceDeductionType ===
                              AttendanceDeductionType.EXCUSED_ABSENCE
                                ? "border-yellow-500 bg-yellow-500 text-white hover:border-yellow-600 hover:bg-yellow-600"
                                : day.isAttended
                                  ? "border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700"
                                  : "border-rose-600 bg-rose-50 text-rose-600 hover:border-rose-700 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
                            }`}
                          >
                            {day.attendance?.attendanceDeductionType ===
                            AttendanceDeductionType.EXCUSED_ABSENCE ? (
                              <CircleAlert
                                className="h-4 w-4 md:h-5 md:w-5"
                                strokeWidth={3}
                              />
                            ) : day.isAttended ? (
                              <Check
                                className="h-4 w-4 md:h-5 md:w-5"
                                strokeWidth={3}
                              />
                            ) : (
                              <X
                                className="h-4 w-4 md:h-5 md:w-5"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                        </button>
                      </div>
                    ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
