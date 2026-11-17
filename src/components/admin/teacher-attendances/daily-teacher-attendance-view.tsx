"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import useSWR from "swr";
import toast from "react-hot-toast";
import { format, subDays, addDays } from "date-fns";
import { ar } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
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

export function DailyTeacherAttendanceView() {
  const t = useTranslations("adminTeacherAttendances");
  const locale = useLocale();
  const dateLocale = locale.startsWith("ar") ? ar : enUS;

  // Selected date state (defaults to today in YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const dateString = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "attended" | "absent" | "late">("all");

  // Dialog state
  const [editingRecord, setEditingRecord] = useState<TeacherDailyAttendanceDTO | null>(null);
  const [isLatenessDialogOpen, setIsLatenessDialogOpen] = useState(false);
  const [togglingTeacherId, setTogglingTeacherId] = useState<string | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"markAllAttended" | "markAllAbsent" | null>(null);

  // SWR for daily attendance
  const { data, isLoading, mutate } = useSWR<TeacherDailyAttendanceDTO[]>(
    `/teacher-attendances/daily?date=${dateString}`,
    () => apiClient.teacherAttendances.getDaily({ date: dateString }),
    { revalidateOnFocus: true }
  );

  const records: TeacherDailyAttendanceDTO[] = useMemo(() => data ?? [], [data]);

  // Summary counts
  const summary = useMemo(() => {
    const total = records.length;
    const attended = records.filter((r: TeacherDailyAttendanceDTO) => r.isAttended).length;
    const absent = total - attended;
    const late = records.filter((r: TeacherDailyAttendanceDTO) => r.attendance?.latenessPeriod != null).length;
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
      if (statusFilter === "late" && (!r.isAttended || !r.attendance?.latenessPeriod)) return false;

      return true;
    });
  }, [records, searchQuery, statusFilter]);

  // Toggle Attendance
  const handleToggle = async (teacher: TeacherDailyAttendanceDTO) => {
    setTogglingTeacherId(teacher.teacherId);
    try {
      const res = await apiClient.teacherAttendances.toggle({
        teacherId: teacher.teacherId,
        attendanceDate: dateString,
      });

      if (res?.attended) {
        toast.success(t("notifications.toggledPresent", { name: teacher.teacherName }));
      } else {
        toast.success(t("notifications.toggledAbsent", { name: teacher.teacherName }));
      }
      await mutate();
    } catch {
      toast.error(t("notifications.error"));
    } finally {
      setTogglingTeacherId(null);
    }
  };

  // Update Lateness
  const handleSaveLateness = async (latenessPeriod: LatenessPeriod | null) => {
    if (!editingRecord?.attendance) return;

    try {
      await apiClient.teacherAttendances.update(editingRecord.attendance.id, {
        latenessPeriod,
      });
      toast.success(t("notifications.latenessUpdated"));
      await mutate();
    } catch {
      toast.error(t("notifications.error"));
    }
  };

  // Bulk Actions
  const handleMarkAllAttended = async () => {
    setIsBulkLoading(true);
    try {
      await apiClient.teacherAttendances.markAllAttended({ date: dateString });
      toast.success(t("notifications.allAttendedSuccess"));
      await mutate();
    } catch {
      toast.error(t("notifications.error"));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleMarkAllAbsent = async () => {
    setIsBulkLoading(true);
    try {
      await apiClient.teacherAttendances.markAllAbsent({ date: dateString });
      toast.success(t("notifications.allAbsentSuccess"));
      await mutate();
    } catch {
      toast.error(t("notifications.error"));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const getLatenessBadge = (period: LatenessPeriod | null | undefined) => {
    if (!period) return null;
    switch (period) {
      case LatenessPeriod.FROM_35_TO_45_MIN:
        return (
          <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
            <Clock className="w-3 h-3 me-1" />
            {t("latenessPeriods.from_35_to_45_min")}
          </Badge>
        );
      case LatenessPeriod.FROM_45_TO_60_MIN:
        return (
          <Badge variant="outline" className="border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-500/10">
            <Clock className="w-3 h-3 me-1" />
            {t("latenessPeriods.from_45_to_60_min")}
          </Badge>
        );
      case LatenessPeriod.MORE_THAN_60_MIN:
        return (
          <Badge variant="outline" className="border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/10">
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
            const isToggling = togglingTeacherId === item.teacherId;
            return (
              <Card
                key={item.teacherId}
                className="overflow-hidden border transition-colors shadow-sm"
              >
                <div className="p-3.5 flex flex-col gap-3">
                  {/* Top row: Name & Attendance status badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          item.isAttended
                            ? item.attendance?.latenessPeriod
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="font-semibold text-sm truncate">
                        {item.teacherName}
                      </span>
                    </div>

                    <div className="shrink-0">
                      {item.isAttended ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-xs py-0.5 px-2">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("statusLabels.present")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 gap-1 text-xs py-0.5 px-2"
                        >
                          <UserX className="w-3 h-3" />
                          {t("statusLabels.absent")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Lateness details row (if attended) */}
                  {item.isAttended && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                      <span className="text-muted-foreground">
                        {t("columns.lateness")}:
                      </span>
                      {item.attendance?.latenessPeriod ? (
                        getLatenessBadge(item.attendance.latenessPeriod)
                      ) : (
                        <span className="text-muted-foreground">
                          {t("latenessPeriods.none")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons row */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant={item.isAttended ? "outline" : "default"}
                      onClick={() => handleToggle(item)}
                      disabled={isToggling}
                      className={`flex-1 h-10 touch-manipulation font-medium text-xs sm:text-sm ${
                        item.isAttended
                          ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {isToggling ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : item.isAttended ? (
                        t("actions.markAbsent")
                      ) : (
                        t("actions.markPresent")
                      )}
                    </Button>

                    {item.isAttended && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingRecord(item);
                          setIsLatenessDialogOpen(true);
                        }}
                        className="h-10 px-3 touch-manipulation text-xs"
                      >
                        <Clock className="h-3.5 w-3.5 me-1" />
                        {t("actions.editLateness")}
                      </Button>
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
              <TableHead className="w-[280px]">{t("columns.teacher")}</TableHead>
              <TableHead>{t("columns.status")}</TableHead>
              <TableHead>{t("columns.lateness")}</TableHead>
              <TableHead className="text-end">{t("columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
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
                  colSpan={4}
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
                const isToggling = togglingTeacherId === item.teacherId;
                return (
                  <TableRow key={item.teacherId} className="hover:bg-muted/40">
                    {/* Teacher name */}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            item.isAttended
                              ? item.attendance?.latenessPeriod
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <span>{item.teacherName}</span>
                      </div>
                    </TableCell>

                    {/* Attendance status badge */}
                    <TableCell>
                      {item.isAttended ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t("statusLabels.present")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20 gap-1 font-medium"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          {t("statusLabels.absent")}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Lateness period */}
                    <TableCell>
                      {item.isAttended ? (
                        item.attendance?.latenessPeriod ? (
                          getLatenessBadge(item.attendance.latenessPeriod)
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("latenessPeriods.none")}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-2">
                        {/* Attendance Toggle button */}
                        <Button
                          size="sm"
                          variant={item.isAttended ? "outline" : "default"}
                          onClick={() => handleToggle(item)}
                          disabled={isToggling}
                          className={
                            item.isAttended
                              ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }
                        >
                          {isToggling ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : item.isAttended ? (
                            t("actions.markAbsent")
                          ) : (
                            t("actions.markPresent")
                          )}
                        </Button>

                        {/* Edit Lateness button (only enabled if attended) */}
                        {item.isAttended && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingRecord(item);
                              setIsLatenessDialogOpen(true);
                            }}
                          >
                            <Clock className="h-3.5 w-3.5 me-1" />
                            {t("actions.editLateness")}
                          </Button>
                        )}
                      </div>
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
