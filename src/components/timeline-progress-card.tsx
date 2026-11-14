"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag,
  Target,
  Sparkles,
  Flame,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { splitDays } from "@/lib/duration";
import { cn } from "@/lib/utils";

interface TimelineProgressCardProps {
  startDate?: string | null;
  targetDate?: string | null;
  completedAt?: string | null;
  fallbackStartDate?: string | null;
  isCompleted?: boolean;
  progressPercentage: number;
  completedCount: number;
  totalCount: number;
  progressLabel?: string;
  progressType?: "steps" | "lessons" | "pages";
  title?: string;
  className?: string;
  children?: ReactNode;
}

export function TimelineProgressCard({
  startDate,
  targetDate,
  completedAt,
  fallbackStartDate,
  isCompleted: isCompletedProp,
  progressPercentage,
  completedCount,
  totalCount,
  progressLabel,
  progressType = "steps",
  title,
  className,
  children,
}: TimelineProgressCardProps) {
  const t = useTranslations("common.timeline");
  const locale = useLocale();

  const timelineStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const effectiveStartDateStr = startDate || fallbackStartDate;
    let parsedStartDate: Date | null = null;
    if (effectiveStartDateStr) {
      const datePart = effectiveStartDateStr.includes("T")
        ? effectiveStartDateStr.split("T")[0]
        : effectiveStartDateStr;
      parsedStartDate = new Date(`${datePart}T00:00:00`);
      if (isNaN(parsedStartDate.getTime())) {
        parsedStartDate = null;
      }
    }

    let parsedTargetDate: Date | null = null;
    if (targetDate) {
      const datePart = targetDate.includes("T")
        ? targetDate.split("T")[0]
        : targetDate;
      parsedTargetDate = new Date(`${datePart}T00:00:00`);
      if (isNaN(parsedTargetDate.getTime())) {
        parsedTargetDate = null;
      }
    }

    const isCompleted =
      isCompletedProp !== undefined
        ? isCompletedProp
        : progressPercentage >= 100 && totalCount > 0;

    let parsedCompletedDate: Date | null = null;
    if (isCompleted && completedAt) {
      const datePart = completedAt.includes("T")
        ? completedAt.split("T")[0]
        : completedAt;
      parsedCompletedDate = new Date(`${datePart}T00:00:00`);
      if (isNaN(parsedCompletedDate.getTime())) {
        parsedCompletedDate = null;
      }
    }

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const daysSinceStart = parsedStartDate
      ? Math.max(
          0,
          Math.round(
            (today.getTime() - parsedStartDate.getTime()) / MS_PER_DAY,
          ),
        )
      : 0;

    let completionDurationText: string | null = null;
    if (isCompleted && parsedCompletedDate && parsedStartDate) {
      const completionDays = Math.max(
        0,
        Math.round(
          (parsedCompletedDate.getTime() - parsedStartDate.getTime()) /
            MS_PER_DAY,
        ),
      );

      if (completionDays === 0) {
        completionDurationText = t("finishedInSameDay");
      } else if (completionDays === 1) {
        completionDurationText = t("finishedInSingleDay");
      } else if (completionDays < 30) {
        completionDurationText = t("finishedInDays", {
          days: completionDays.toLocaleString(locale),
        });
      } else {
        const { months, days: remainingDays } = splitDays(completionDays);
        if (remainingDays === 0) {
          completionDurationText =
            months === 1
              ? t("finishedInSingleMonth")
              : months === 2
                ? t("finishedInTwoMonths")
                : t("finishedInMonths", {
                    months: months.toLocaleString(locale),
                  });
        } else {
          completionDurationText = t("finishedInMonthsAndDays", {
            months: months.toLocaleString(locale),
            days: remainingDays.toLocaleString(locale),
          });
        }
      }
    }

    if (!parsedTargetDate) {
      return {
        hasTarget: false,
        isCompleted,
        isOverdue: false,
        startDate: parsedStartDate,
        targetDate: null,
        totalDays: null,
        daysRemaining: null,
        daysSinceStart,
        timePercentage: 0,
        parsedCompletedDate,
        daysDeltaOnFinish: null,
        completionDurationText,
        pacing: "onTrack" as const,
        statusType: isCompleted ? ("completed" as const) : ("ongoing" as const),
      };
    }

    const baselineStartDate = parsedStartDate ?? today;
    const totalDays = Math.max(
      1,
      Math.round(
        (parsedTargetDate.getTime() - baselineStartDate.getTime()) / MS_PER_DAY,
      ),
    );

    const daysRemaining = Math.round(
      (parsedTargetDate.getTime() - today.getTime()) / MS_PER_DAY,
    );

    const isOverdue = !isCompleted && daysRemaining < 0;

    const elapsedDays = parsedStartDate
      ? Math.max(
          0,
          Math.min(
            totalDays,
            Math.round(
              (today.getTime() - parsedStartDate.getTime()) / MS_PER_DAY,
            ),
          ),
        )
      : Math.max(0, totalDays - Math.max(0, daysRemaining));

    const timePercentage = Math.min(
      100,
      Math.max(0, Math.round((elapsedDays / totalDays) * 100)),
    );

    let daysDeltaOnFinish: number | null = null;
    if (isCompleted && parsedCompletedDate) {
      daysDeltaOnFinish = Math.round(
        (parsedTargetDate.getTime() - parsedCompletedDate.getTime()) /
          MS_PER_DAY,
      );
    }

    let pacing: "ahead" | "onTrack" | "behind" = "onTrack";
    if (!isCompleted && !isOverdue) {
      if (progressPercentage >= timePercentage + 15) {
        pacing = "ahead";
      } else if (progressPercentage < timePercentage - 15) {
        pacing = "behind";
      }
    }

    return {
      hasTarget: true,
      isCompleted,
      isOverdue,
      startDate: parsedStartDate,
      targetDate: parsedTargetDate,
      totalDays,
      daysRemaining,
      daysSinceStart,
      timePercentage,
      parsedCompletedDate,
      daysDeltaOnFinish,
      completionDurationText,
      pacing,
      statusType: isCompleted
        ? daysDeltaOnFinish !== null && daysDeltaOnFinish >= 0
          ? ("completedAhead" as const)
          : daysDeltaOnFinish !== null && daysDeltaOnFinish < 0
            ? ("completedLate" as const)
            : ("completed" as const)
        : isOverdue
          ? ("overdue" as const)
          : pacing,
    };
  }, [
    startDate,
    targetDate,
    completedAt,
    fallbackStartDate,
    isCompletedProp,
    progressPercentage,
    totalCount,
    locale,
    t,
  ]);

  const displayStartDate = startDate || fallbackStartDate || t("noStartDate");
  const displayTargetDate = targetDate || t("noTargetDate");
  const displayCompletedDate = completedAt
    ? completedAt.includes("T")
      ? completedAt.split("T")[0]
      : completedAt
    : null;

  const completionDurationLabel =
    progressType === "lessons"
      ? t("completionDurationCourse")
      : progressType === "pages"
        ? t("completionDurationBook")
        : progressType === "steps"
          ? t("completionDurationGoal")
          : t("completionDuration");

  return (
    <Card
      className={cn(
        "rounded-2xl border bg-card shadow-xs overflow-hidden",
        className,
      )}
    >
      <CardHeader className="border-b px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <Clock className="size-4 text-primary" />
            <span>{title ?? t("title")}</span>
          </CardTitle>

          {/* Status Badge */}
          {timelineStats.statusType === "completed" && (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-medium">
              <CheckCircle2 className="size-3.5" />
              <span>{t("completedOnTime")}</span>
            </Badge>
          )}

          {timelineStats.statusType === "completedAhead" && (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-medium">
              <Sparkles className="size-3.5" />
              <span>
                {timelineStats.daysDeltaOnFinish &&
                timelineStats.daysDeltaOnFinish > 0
                  ? t("completedAhead", {
                      count: timelineStats.daysDeltaOnFinish,
                    })
                  : t("completedOnTime")}
              </span>
            </Badge>
          )}

          {timelineStats.statusType === "completedLate" && (
            <Badge
              variant="outline"
              className="text-muted-foreground border-border gap-1.5 font-medium"
            >
              <CheckCircle2 className="size-3.5" />
              <span>
                {timelineStats.daysDeltaOnFinish
                  ? t("completedLate", {
                      count: Math.abs(timelineStats.daysDeltaOnFinish),
                    })
                  : t("completedDate", { date: targetDate ?? "" })}
              </span>
            </Badge>
          )}

          {timelineStats.statusType === "overdue" && (
            <Badge
              variant="destructive"
              className="gap-1.5 font-medium shadow-xs animate-pulse"
            >
              <AlertTriangle className="size-3.5" />
              <span>
                {Math.abs(timelineStats.daysRemaining ?? 0) === 1
                  ? t("overdueOneDay")
                  : t("overdue", {
                      count: Math.abs(timelineStats.daysRemaining ?? 0),
                    })}
              </span>
            </Badge>
          )}

          {timelineStats.statusType === "ahead" && (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-medium">
              <Flame className="size-3.5" />
              <span>{t("aheadOfPace")}</span>
            </Badge>
          )}

          {timelineStats.statusType === "onTrack" && (
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <Sparkles className="size-3.5 text-primary" />
              <span>{t("onTrack")}</span>
            </Badge>
          )}

          {timelineStats.statusType === "behind" && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 font-medium"
            >
              <AlertTriangle className="size-3.5" />
              <span>{t("behindPace")}</span>
            </Badge>
          )}

          {timelineStats.statusType === "ongoing" && (
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <Calendar className="size-3.5 text-muted-foreground" />
              <span>{t("ongoing")}</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Visual Timeline Track Bar (if target date is specified) */}
        {timelineStats.hasTarget && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-2xs">
                <Calendar className="size-3.5 text-primary" />
                <span>{t("timelineTrack")}</span>
              </span>
              <span className="text-2xs font-normal">
                {timelineStats.isCompleted ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {t("completed")}
                  </span>
                ) : timelineStats.isOverdue ? (
                  <span className="font-semibold text-destructive">
                    {t("overdue", {
                      count: Math.abs(timelineStats.daysRemaining ?? 0),
                    })}
                  </span>
                ) : typeof timelineStats.daysRemaining === "number" &&
                  timelineStats.daysRemaining >= 0 ? (
                  timelineStats.daysRemaining === 0 ? (
                    t("dueToday")
                  ) : timelineStats.daysRemaining === 1 ? (
                    t("dayLeft")
                  ) : (
                    t("daysLeft", { count: timelineStats.daysRemaining })
                  )
                ) : null}
              </span>
            </div>

            <div className="relative flex items-center justify-between text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5 shrink-0">
                <Flag className="size-3.5 text-primary" />
                <span>{displayStartDate}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Target className="size-3.5 text-primary" />
                <span>{displayTargetDate}</span>
              </div>
            </div>

            {/* Progress track */}
            <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
              {/* Time elapsed bar */}
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  timelineStats.isOverdue
                    ? "bg-destructive/80 w-full"
                    : timelineStats.isCompleted
                      ? "bg-emerald-500"
                      : "bg-primary/30",
                )}
                style={{
                  width: timelineStats.isOverdue
                    ? "100%"
                    : `${timelineStats.timePercentage}%`,
                }}
              />

              {/* Step/item completion overlay fill */}
              {!timelineStats.isCompleted && !timelineStats.isOverdue && (
                <div
                  className="absolute inset-y-0 start-0 bg-primary transition-all duration-500 opacity-90"
                  style={{ width: `${progressPercentage}%` }}
                />
              )}
            </div>

            {/* Sub-label under bar */}
            <div className="flex items-center justify-between text-2xs text-muted-foreground gap-2">
              <span>
                {t("timeElapsed", { percent: timelineStats.timePercentage })}
              </span>
            </div>
          </div>
        )}

        {/* Completed Duration Insight Box */}
        {timelineStats.isCompleted && timelineStats.completionDurationText && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 shadow-2xs">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Timer className="size-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground block">
                {completionDurationLabel}
              </span>
              <p className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                {timelineStats.completionDurationText}
              </p>
            </div>
          </div>
        )}

        {/* 4 Clean Metric Cards Grid (under Timeline) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* 1. Start Date */}
          <div className="rounded-xl border bg-card/60 p-3 space-y-1">
            <span className="text-2xs font-medium text-muted-foreground block">
              {t("startDate")}
            </span>
            <span className="text-sm font-semibold text-foreground block">
              {displayStartDate}
            </span>
          </div>

          {/* 2. Target Date */}
          <div className="rounded-xl border bg-card/60 p-3 space-y-1">
            <span className="text-2xs font-medium text-muted-foreground block">
              {t("targetDate")}
            </span>
            <span className="text-sm font-semibold text-foreground block">
              {displayTargetDate}
            </span>
          </div>

          {/* 3. Schedule / Completion Date */}
          <div className="rounded-xl border bg-card/60 p-3 space-y-1">
            <span className="text-2xs font-medium text-muted-foreground block">
              {timelineStats.isCompleted
                ? displayCompletedDate
                  ? t("completionDate")
                  : t("status")
                : timelineStats.hasTarget
                  ? t("scheduleStatus")
                  : t("activeTime")}
            </span>
            <span
              className={cn(
                "text-sm font-semibold block truncate",
                timelineStats.isOverdue && "text-destructive",
                timelineStats.isCompleted &&
                  "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {timelineStats.isCompleted ? (
                displayCompletedDate ? (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>{displayCompletedDate}</span>
                  </span>
                ) : (
                  t("completed")
                )
              ) : timelineStats.isOverdue ? (
                t("overdue", {
                  count: Math.abs(timelineStats.daysRemaining ?? 0),
                })
              ) : timelineStats.hasTarget &&
                typeof timelineStats.daysRemaining === "number" ? (
                t("daysLeft", { count: timelineStats.daysRemaining })
              ) : (
                t("daysActive", { count: timelineStats.daysSinceStart })
              )}
            </span>
          </div>

          {/* 4. Progress Ratio */}
          <div className="rounded-xl border bg-card/60 p-3 space-y-1">
            <span className="text-2xs font-medium text-muted-foreground block">
              {progressLabel ??
                (progressType === "lessons"
                  ? t("lessonsRatio")
                  : progressType === "pages"
                    ? t("pagesRatio")
                    : t("stepsRatio"))}
            </span>
            <span className="text-sm font-semibold text-foreground block">
              {completedCount} / {totalCount} ({progressPercentage}%)
            </span>
          </div>
        </div>

        {/* Progress Section (Children) at the end */}
        {children}
      </CardContent>
    </Card>
  );
}
