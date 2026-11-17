"use client";

import { useState } from "react";
import { CalendarDays, CalendarRange } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DailyTeacherAttendanceView } from "./daily-teacher-attendance-view";
import { WeeklyTeacherAttendanceView } from "./weekly-teacher-attendance-view";

type AttendanceViewMode = "daily" | "weekly";

interface TeacherAttendanceWorkspaceProps {
  workingDays: number[];
}

export function TeacherAttendanceWorkspace({
  workingDays,
}: TeacherAttendanceWorkspaceProps) {
  const t = useTranslations("adminTeacherAttendances");
  const [viewMode, setViewMode] = useState<AttendanceViewMode>("daily");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div
          className="grid w-full grid-cols-2 rounded-xl bg-muted p-1 sm:w-auto"
          role="group"
          aria-label={t("title")}
        >
          <Button
            type="button"
            variant="ghost"
            aria-pressed={viewMode === "daily"}
            onClick={() => setViewMode("daily")}
            className={`h-10 rounded-lg px-4 transition-colors ${
              viewMode === "daily"
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground"
            }`}
          >
            <CalendarDays className="me-2 h-4 w-4" />
            {t("dailyView")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-pressed={viewMode === "weekly"}
            onClick={() => setViewMode("weekly")}
            className={`h-10 rounded-lg px-4 transition-colors ${
              viewMode === "weekly"
                ? "bg-background text-foreground shadow-sm hover:bg-background"
                : "text-muted-foreground"
            }`}
          >
            <CalendarRange className="me-2 h-4 w-4" />
            {t("weeklyView")}
          </Button>
        </div>
      </div>

      {viewMode === "daily" ? (
        <DailyTeacherAttendanceView
          showHeader={false}
          workingDays={workingDays}
        />
      ) : (
        <WeeklyTeacherAttendanceView workingDays={workingDays} />
      )}
    </div>
  );
}
