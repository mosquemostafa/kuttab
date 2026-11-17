"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api/api-client";
import type { TeacherSalaryReportItemDTO } from "@/shared/types/teacher-attendance.types";

function getCurrentMonth(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function shiftMonth(value: string, amount: number): string {
  const [year, month] = value.split("-").map(Number);
  const next = new Date(year, month - 1 + amount, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tabular-nums sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function SalaryReportView() {
  const t = useTranslations("adminSalaryReports");
  const locale = useLocale();
  const isRtl = locale.startsWith("ar");
  const calendarLocale = isRtl
    ? `${locale}-u-ca-gregory-nu-arab`
    : `${locale}-u-ca-gregory`;
  const [month, setMonth] = useState(getCurrentMonth);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() =>
    Number(getCurrentMonth().slice(0, 4)),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ["teacher-salary-report", month] as const,
    ([, selectedMonth]) =>
      apiClient.teacherAttendances.getSalaryReport({ month: selectedMonth }),
    { revalidateOnFocus: false },
  );

  const amountFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale],
  );
  const monthLabel = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    return new Intl.DateTimeFormat(calendarLocale, {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  }, [calendarLocale, month]);
  const localizedYear = useMemo(
    () =>
      new Intl.NumberFormat(isRtl ? `${locale}-u-nu-arab` : locale, {
        useGrouping: false,
      }).format(pickerYear),
    [isRtl, locale, pickerYear],
  );
  const localizedMonths = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        new Intl.DateTimeFormat(calendarLocale, {
          month: "long",
          timeZone: "UTC",
        }).format(new Date(Date.UTC(2024, index, 1))),
      ),
    [calendarLocale],
  );

  const handleMonthPickerOpenChange = (open: boolean) => {
    setIsMonthPickerOpen(open);
    if (open) {
      setPickerYear(Number(month.slice(0, 4)));
    }
  };

  const selectMonth = (monthIndex: number) => {
    setMonth(`${pickerYear}-${String(monthIndex + 1).padStart(2, "0")}`);
    setIsMonthPickerOpen(false);
  };

  const filteredTeachers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase(locale);
    if (!normalizedQuery) return data?.teachers ?? [];
    return (data?.teachers ?? []).filter((teacher) =>
      teacher.teacherName.toLocaleLowerCase(locale).includes(normalizedQuery),
    );
  }, [data?.teachers, locale, searchQuery]);

  const formatMoney = (value: number | null) =>
    value === null ? t("missingSalary") : amountFormatter.format(value);
  const formatDays = (value: number) =>
    t("dayCount", { count: numberFormatter.format(value) });

  const renderTeacherCard = (teacher: TeacherSalaryReportItemDTO) => (
    <article
      key={teacher.teacherId}
      className="rounded-xl bg-card p-4 shadow-xs ring-1 ring-foreground/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{teacher.teacherName}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("attendanceValue", {
              attended: teacher.attendedDays,
              expected: teacher.expectedWorkingDays,
            })}
          </p>
        </div>
        {teacher.monthlySalary === null ? (
          <Badge variant="destructive">{t("salaryNotSet")}</Badge>
        ) : (
          <p className="shrink-0 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatMoney(teacher.netSalary)}
          </p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t("baseSalary")}</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {formatMoney(teacher.monthlySalary)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("deductions")}</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-destructive">
            {formatMoney(teacher.totalDeductionAmount)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("absence")}</dt>
          <dd className="mt-0.5 tabular-nums">
            {formatDays(teacher.absentDays)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">          {t("deduction")}</dt>
          <dd className="mt-0.5 tabular-nums">
            {formatDays(teacher.deductionDays)}
          </dd>
        </div>
      </dl>
    </article>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div
          className="grid w-full grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2 sm:w-auto sm:min-w-md"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            onClick={() => setMonth((current) => shiftMonth(current, -1))}
            aria-label={t("previousMonth")}
          >
            {isRtl ? <ChevronRight /> : <ChevronLeft />}
          </Button>
          <Popover
            open={isMonthPickerOpen}
            onOpenChange={handleMonthPickerOpenChange}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 min-w-0 justify-center gap-2 px-3 font-medium"
                aria-label={`${t("selectMonth")}: ${monthLabel}`}
              >
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{monthLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="center"
              className="w-[min(20rem,calc(100vw-2rem))] gap-3 p-3"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  onClick={() =>
                    setPickerYear((year) => Math.max(1000, year - 1))
                  }
                  disabled={pickerYear <= 1000}
                  aria-label={t("previousYear")}
                >
                  {isRtl ? <ChevronRight /> : <ChevronLeft />}
                </Button>
                <p className="text-center text-base font-semibold tabular-nums">
                  {localizedYear}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  onClick={() =>
                    setPickerYear((year) => Math.min(9999, year + 1))
                  }
                  disabled={pickerYear >= 9999}
                  aria-label={t("nextYear")}
                >
                  {isRtl ? <ChevronLeft /> : <ChevronRight />}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {localizedMonths.map((localizedMonth, monthIndex) => {
                  const value = `${pickerYear}-${String(monthIndex + 1).padStart(2, "0")}`;
                  const isSelected = value === month;

                  return (
                    <Button
                      key={monthIndex}
                      type="button"
                      variant={isSelected ? "default" : "ghost"}
                      className="h-11 min-w-0 px-2 text-sm"
                      onClick={() => selectMonth(monthIndex)}
                      aria-pressed={isSelected}
                    >
                      <span className="truncate">{localizedMonth}</span>
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            onClick={() => setMonth((current) => shiftMonth(current, 1))}
            aria-label={t("nextMonth")}
          >
            {isRtl ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>
      </div>

      {data ? (
        <section
          className="grid grid-cols-2 divide-x divide-y overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10 rtl:divide-x-reverse md:grid-cols-4 md:divide-y-0"
          aria-label={t("summary")}
        >
          <Metric
            label={t("workingDays")}
            value={numberFormatter.format(data.workingDates.length)}
          />
          <Metric
            label={t("totalSalaries")}
            value={amountFormatter.format(data.summary.totalMonthlySalaries)}
          />
          <Metric
            label={t("totalDeductions")}
            value={amountFormatter.format(data.summary.totalDeductions)}
          />
          <Metric
            label={t("totalNet")}
            value={amountFormatter.format(data.summary.totalNetSalaries)}
          />
        </section>
      ) : null}

      {data?.summary.missingSalaryCount ? (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-900 ring-1 ring-amber-600/20 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            {t("missingSalaryNotice", {
              count: data.summary.missingSalaryCount,
            })}
          </p>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-10 ps-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-10 shrink-0"
          onClick={() => void mutate()}
          disabled={isValidating}
          aria-label={t("refresh")}
        >
          <RefreshCw className={isValidating ? "animate-spin" : ""} />
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl bg-card px-5 py-8 text-center shadow-xs ring-1 ring-destructive/30">
          <AlertCircle className="mx-auto size-8 text-destructive" />
          <h2 className="mt-3 font-semibold">{t("errorTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("errorDescription")}
          </p>
          <Button className="mt-4" onClick={() => void mutate()}>
            {t("tryAgain")}
          </Button>
        </div>
      ) : isLoading ? (
        <ReportSkeleton />
      ) : filteredTeachers.length === 0 ? (
        <div className="rounded-xl bg-card px-5 py-12 text-center shadow-xs ring-1 ring-foreground/10">
          <WalletCards className="mx-auto size-9 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">{t("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchQuery ? t("emptySearch") : t("emptyDescription")}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filteredTeachers.map(renderTeacherCard)}
          </div>

          <div className="hidden overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="ps-4">{t("teacher")}</TableHead>
                  <TableHead>{t("attendance")}</TableHead>
                  <TableHead>{t("absence")}</TableHead>
                  <TableHead>{t("deduction")}</TableHead>
                  <TableHead>{t("baseSalary")}</TableHead>
                  <TableHead>{t("deductions")}</TableHead>
                  <TableHead className="pe-4">{t("netSalary")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.teacherId}>
                    <TableCell className="ps-4 font-medium">
                      <div className="flex items-center gap-2">
                        <span>{teacher.teacherName}</span>
                        {teacher.monthlySalary === null ? (
                          <Badge variant="destructive">
                            {t("salaryNotSet")}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {t("attendanceValue", {
                        attended: teacher.attendedDays,
                        expected: teacher.expectedWorkingDays,
                      })}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDays(teacher.absentDays)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDays(teacher.deductionDays)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatMoney(teacher.monthlySalary)}
                    </TableCell>
                    <TableCell className="tabular-nums text-destructive">
                      {formatMoney(teacher.totalDeductionAmount)}
                    </TableCell>
                    <TableCell className="pe-4 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatMoney(teacher.netSalary)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
