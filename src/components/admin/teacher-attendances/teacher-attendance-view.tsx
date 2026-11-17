"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format, subDays, addDays } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import {
  Calendar as CalendarIcon,
  Check,
  X,
  Clock,
  UserCheck,
  UserX,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { apiClient } from "@/lib/api/api-client";
import { useApiErrorMessage } from "@/lib/api/use-api-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LatenessPeriod,
  type TeacherDailyAttendanceDTO,
} from "@/shared/types/teacher-attendance.types";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { AttendanceLatenessDialog } from "./attendance-lateness-dialog";

export function TeacherAttendanceView() {
  const t = useTranslations("adminTeacherAttendances");
  const getErrorMessage = useApiErrorMessage();
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;

  // Selected date state (defaults to today in YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const dateString = useMemo(
    () => format(selectedDate, "yyyy-MM-dd"),
    [selectedDate],
  );

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "attended" | "absent" | "late"
  >("all");

  // Dialog state
  const [editingRecord, setEditingRecord] =
    useState<TeacherDailyAttendanceDTO | null>(null);
  const [isLatenessDialogOpen, setIsLatenessDialogOpen] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "markAllAttended" | "markAllAbsent" | null
  >(null);

  /** Bumped per teacher id on each toggle so stale in-flight responses don't overwrite optimistic updates */
  const teacherToggleOpGenRef = useRef<Record<string, number>>({});

  // SWR for daily attendance
  const { data, isLoading, mutate } = useSWR<TeacherDailyAttendanceDTO[]>(
    `/teacher-attendances/daily?date=${dateString}`,
    () => apiClient.teacherAttendances.getDaily({ date: dateString }),
    { revalidateOnFocus: true },
  );

  const records: TeacherDailyAttendanceDTO[] = useMemo(
    () => data ?? [],
    [data],
  );

  // Summary counts
  const summary = useMemo(() => {
    const total = records.length;
    const attended = records.filter(
      (r: TeacherDailyAttendanceDTO) => r.isAttended,
    ).length;
    const absent = total - attended;
    const late = records.filter(
      (r: TeacherDailyAttendanceDTO) => r.attendance?.latenessPeriod != null,
    ).length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { total, attended, absent, late, rate };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r: TeacherDailyAttendanceDTO) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!r.teacherName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status
      if (statusFilter === "attended" && !r.isAttended) return false;
      if (statusFilter === "absent" && r.isAttended) return false;
      if (
        statusFilter === "late" &&
        (!r.isAttended || !r.attendance?.latenessPeriod)
      )
        return false;

      return true;
    });
  }, [records, searchQuery, statusFilter]);

  const bumpTeacherToggleOpGen = (teacherId: string) => {
    const next = (teacherToggleOpGenRef.current[teacherId] ?? 0) + 1;
    teacherToggleOpGenRef.current[teacherId] = next;
    return next;
  };

  const optimisticToggle = (teacherId: string, nextAttended: boolean) => {
    mutate(
      (prev) =>
        prev
          ? prev.map((item) => {
              if (item.teacherId !== teacherId) return item;
              return {
                ...item,
                isAttended: nextAttended,
                attendance: nextAttended
                  ? (item.attendance ?? {
                      id: `temp-${Date.now()}`,
                      teacherId: item.teacherId,
                      attendanceDate: dateString,
                      latenessPeriod: null,
                      recordedBy: "",
                      createdAt: new Date().toISOString(),
                    })
                  : null,
              };
            })
          : prev,
      false,
    );
  };

  // Toggle Attendance with Optimistic UI
  const handleToggle = async (teacher: TeacherDailyAttendanceDTO) => {
    const nextAttended = !teacher.isAttended;
    const opGen = bumpTeacherToggleOpGen(teacher.teacherId);

    // Apply optimistic update immediately
    optimisticToggle(teacher.teacherId, nextAttended);

    if (nextAttended) {
      toast.success(
        t("notifications.toggledPresent", { name: teacher.teacherName }),
      );
    } else {
      toast.success(
        t("notifications.toggledAbsent", { name: teacher.teacherName }),
      );
    }

    try {
      await apiClient.teacherAttendances.toggle({
        teacherId: teacher.teacherId,
        attendanceDate: dateString,
      });
    } catch (error) {
      // Rollback on failure
      optimisticToggle(teacher.teacherId, !nextAttended);
      toast.error(getErrorMessage(error) || t("notifications.error"));
      return;
    }

    // Skip mutate revalidation if another toggle operation was initiated for this teacher
    if (teacherToggleOpGenRef.current[teacher.teacherId] !== opGen) {
      return;
    }

    await mutate();
  };

  // Update Lateness with Optimistic UI
  const handleSaveLateness = async (latenessPeriod: LatenessPeriod | null) => {
    if (!editingRecord?.attendance) return;

    const currentAttendance = editingRecord.attendance;
    const previousPeriod = currentAttendance.latenessPeriod;
    const attendanceId = currentAttendance.id;
    const teacherId = editingRecord.teacherId;

    // Optimistically update lateness in SWR cache
    mutate(
      (prev) =>
        prev
          ? prev.map((item) =>
              item.teacherId === teacherId && item.attendance
                ? {
                    ...item,
                    attendance: {
                      ...item.attendance,
                      latenessPeriod,
                    },
                  }
                : item,
            )
          : prev,
      false,
    );

    toast.success(t("notifications.latenessUpdated"));

    try {
      await apiClient.teacherAttendances.update(attendanceId, {
        latenessPeriod,
      });
      await mutate();
    } catch (error) {
      // Rollback on failure
      mutate(
        (prev) =>
          prev
            ? prev.map((item) =>
                item.teacherId === teacherId && item.attendance
                  ? {
                      ...item,
                      attendance: {
                        ...item.attendance,
                        latenessPeriod: previousPeriod,
                      },
                    }
                  : item,
              )
            : prev,
        false,
      );
      toast.error(getErrorMessage(error) || t("notifications.error"));
    }
  };

  // Bulk Actions
  const handleMarkAllAttended = async () => {
    setIsBulkLoading(true);
    const previousData = records;

    // Optimistically mark all as attended
    mutate(
      (prev) =>
        prev
          ? prev.map((item) => ({
              ...item,
              isAttended: true,
              attendance: item.attendance ?? {
                id: `temp-${item.teacherId}-${Date.now()}`,
                teacherId: item.teacherId,
                attendanceDate: dateString,
                latenessPeriod: null,
                recordedBy: "",
                createdAt: new Date().toISOString(),
              },
            }))
          : prev,
      false,
    );
    toast.success(t("notifications.allAttendedSuccess"));

    try {
      await apiClient.teacherAttendances.markAllAttended({ date: dateString });
      await mutate();
    } catch (error) {
      mutate(previousData, false);
      toast.error(getErrorMessage(error) || t("notifications.error"));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleMarkAllAbsent = async () => {
    setIsBulkLoading(true);
    const previousData = records;

    // Optimistically mark all as absent
    mutate(
      (prev) =>
        prev
          ? prev.map((item) => ({
              ...item,
              isAttended: false,
              attendance: null,
            }))
          : prev,
      false,
    );
    toast.success(t("notifications.allAbsentSuccess"));

    try {
      await apiClient.teacherAttendances.markAllAbsent({ date: dateString });
      await mutate();
    } catch (error) {
      mutate(previousData, false);
      toast.error(getErrorMessage(error) || t("notifications.error"));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const getLatenessBadge = (period: LatenessPeriod | null | undefined) => {
    if (!period) return null;
    switch (period) {
      case LatenessPeriod.FROM_35_TO_45_MIN:
        return (
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
          >
            <Clock className="w-3 h-3 me-1" />
            {t("latenessPeriods.from_35_to_45_min")}
          </Badge>
        );
      case LatenessPeriod.FROM_45_TO_60_MIN:
        return (
          <Badge
            variant="outline"
            className="border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-500/10"
          >
            <Clock className="w-3 h-3 me-1" />
            {t("latenessPeriods.from_45_to_60_min")}
          </Badge>
        );
      case LatenessPeriod.MORE_THAN_60_MIN:
        return (
          <Badge
            variant="outline"
            className="border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10"
          >
            <Clock className="w-3 h-3 me-1" />
            {t("latenessPeriods.more_than_60_min")}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Title and Date Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Date Navigation & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-card p-3 sm:p-4 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          {/* Day stepping buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 touch-manipulation"
              onClick={() =>
                setSelectedDate((d) =>
                  locale.startsWith("ar") ? addDays(d, 1) : subDays(d, 1),
                )
              }
              aria-label="Previous day"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 font-normal px-2.5 sm:px-3 text-xs sm:text-sm min-w-[155px] sm:min-w-[190px] justify-start touch-manipulation"
                >
                  <CalendarIcon className="me-1.5 sm:me-2 h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {format(selectedDate, "EEE, d MMM yyyy", {
                      locale: dateLocale,
                    })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => d && setSelectedDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 touch-manipulation"
              onClick={() =>
                setSelectedDate((d) =>
                  locale.startsWith("ar") ? subDays(d, 1) : addDays(d, 1),
                )
              }
              aria-label="Next day"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick shortcuts */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className="h-9 text-xs px-2.5 font-medium touch-manipulation"
            >
              {t("today")}
            </Button>
          </div>
        </div>

        {/* Quick bulk actions at the top */}
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          <Button
            variant="outline"
            size="sm"
            disabled={isBulkLoading || isLoading || records.length === 0}
            onClick={() => setConfirmAction("markAllAttended")}
            className="flex-1 sm:flex-initial h-9 text-xs sm:text-sm font-medium touch-manipulation border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-700"
          >
            <UserCheck className="h-4 w-4 me-1.5" />
            {t("actions.markAllAttended")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isBulkLoading || isLoading || summary.attended === 0}
            onClick={() => setConfirmAction("markAllAbsent")}
            className="flex-1 sm:flex-initial h-9 text-xs sm:text-sm font-medium touch-manipulation border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-700"
          >
            <UserX className="h-4 w-4 me-1.5" />
            {t("actions.markAllAbsent")}
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards - 2x2 grid on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-4">
        <Card className="bg-card shadow-sm border">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                {t("summary.totalTeachers")}
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1">
                {summary.total}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                {t("summary.attended")}
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 text-emerald-600 dark:text-emerald-400">
                {summary.attended}
                <span className="text-[10px] sm:text-xs font-normal text-muted-foreground ms-1">
                  ({summary.rate}%)
                </span>
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                {t("summary.absent")}
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 text-rose-600 dark:text-rose-400">
                {summary.absent}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <UserX className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-medium text-muted-foreground">
                {t("summary.late")}
              </p>
              <p className="text-xl sm:text-2xl font-bold mt-0.5 sm:mt-1 text-amber-600 dark:text-amber-400">
                {summary.late}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-10 touch-manipulation text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v: "all" | "attended" | "absent" | "late") =>
              setStatusFilter(v)
            }
          >
            <SelectTrigger className="w-full sm:w-[170px] h-10 text-sm">
              <SelectValue placeholder={t("filterStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="attended">{t("onlyAttended")}</SelectItem>
              <SelectItem value="absent">{t("onlyAbsent")}</SelectItem>
              <SelectItem value="late">{t("onlyLate")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Card List (shown on mobile < md) */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t("actions.refresh")}...</span>
            </div>
          </Card>
        ) : filteredRecords.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <p className="font-semibold text-sm">{t("empty.title")}</p>
            <p className="text-xs mt-1 text-muted-foreground">
              {t("empty.description")}
            </p>
          </Card>
        ) : (
          filteredRecords.map((item) => {
            return (
              <Card
                key={item.teacherId}
                className="overflow-hidden border transition-colors shadow-sm"
              >
                <div className="p-3.5 flex items-center justify-between gap-3">
                  {/* Left: Checkbox & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(item)}
                      title={
                        item.isAttended
                          ? t("statusLabels.present")
                          : t("statusLabels.absent")
                      }
                      aria-label={`${item.teacherName}: ${item.isAttended ? t("statusLabels.present") : t("statusLabels.absent")}`}
                      className={`h-7 w-7 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                        item.isAttended
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-xs hover:bg-emerald-600"
                          : "bg-rose-500 border-rose-600 text-white shadow-xs hover:bg-rose-600"
                      }`}
                    >
                      {item.isAttended ? (
                        <Check className="h-4 w-4 stroke-[2.5]" />
                      ) : (
                        <X className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </button>
                    <span className="font-semibold text-sm truncate">
                      {item.teacherName}
                    </span>
                  </div>

                  {/* Right: Lateness trigger/badge (only if attended) */}
                  <div className="shrink-0 flex items-center">
                    {item.isAttended ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRecord(item);
                          setIsLatenessDialogOpen(true);
                        }}
                        className="cursor-pointer hover:opacity-80 transition-opacity p-1 -m-1"
                      >
                        {item.attendance?.latenessPeriod ? (
                          getLatenessBadge(item.attendance.latenessPeriod)
                        ) : (
                          <span className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t("latenessPeriods.none")}
                          </span>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, visible on md and up) */}
      <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px] text-center">
                {t("columns.status")}
              </TableHead>
              <TableHead>{t("columns.teacher")}</TableHead>
              <TableHead className="text-end">
                {t("columns.lateness")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t("actions.refresh")}...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-32 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <p className="font-semibold">{t("empty.title")}</p>
                    <p className="text-xs">{t("empty.description")}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((item) => {
                return (
                  <TableRow key={item.teacherId} className="hover:bg-muted/40">
                    {/* Status Checkbox */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(item)}
                          title={
                            item.isAttended
                              ? t("statusLabels.present")
                              : t("statusLabels.absent")
                          }
                          aria-label={`${item.teacherName}: ${item.isAttended ? t("statusLabels.present") : t("statusLabels.absent")}`}
                          className={`h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer border ${
                            item.isAttended
                              ? "bg-emerald-500 border-emerald-600 text-white shadow-xs hover:bg-emerald-600"
                              : "bg-rose-500 border-rose-600 text-white shadow-xs hover:bg-rose-600"
                          }`}
                        >
                          {item.isAttended ? (
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          ) : (
                            <X className="h-4 w-4 stroke-[2.5]" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Teacher name */}
                    <TableCell className="font-medium">
                      <span>{item.teacherName}</span>
                    </TableCell>

                    {/* Lateness period */}
                    <TableCell className="text-end">
                      {item.isAttended ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(item);
                            setIsLatenessDialogOpen(true);
                          }}
                          className="cursor-pointer inline-flex items-center gap-1 hover:opacity-80 transition-opacity p-1 -m-1"
                        >
                          {item.attendance?.latenessPeriod ? (
                            getLatenessBadge(item.attendance.latenessPeriod)
                          ) : (
                            <span className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t("latenessPeriods.none")}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Lateness Dialog */}
      <AttendanceLatenessDialog
        open={isLatenessDialogOpen}
        onOpenChange={setIsLatenessDialogOpen}
        record={editingRecord}
        attendanceDate={dateString}
        onSave={handleSaveLateness}
      />

      {/* Confirmation Dialog for Mark All Attended */}
      <ConfirmationDialog
        isOpen={confirmAction === "markAllAttended"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleMarkAllAttended}
        title={t("confirm.markAllAttendedTitle")}
        description={t("confirm.markAllAttendedDesc", { date: dateString })}
        confirmText={t("actions.markAllAttended")}
        cancelText={t("actions.cancel")}
        dir={locale.startsWith("ar") ? "rtl" : "ltr"}
      />

      {/* Confirmation Dialog for Mark All Absent */}
      <ConfirmationDialog
        isOpen={confirmAction === "markAllAbsent"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleMarkAllAbsent}
        title={t("confirm.markAllAbsentTitle")}
        description={t("confirm.markAllAbsentDesc", { date: dateString })}
        confirmText={t("actions.markAllAbsent")}
        cancelText={t("actions.cancel")}
        confirmVariant="destructive"
        dir={locale.startsWith("ar") ? "rtl" : "ltr"}
      />
    </div>
  );
}

