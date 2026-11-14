import { parseDateOnlyToLocal } from "@/lib/date-time";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type DurationBreakdown = {
  months: number;
  weeks: number;
  days: number;
};

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const targetMonth = date.getMonth() + months;
  result.setMonth(targetMonth);
  const adjustedMonth = ((targetMonth % 12) + 12) % 12;
  if (result.getMonth() !== adjustedMonth) {
    result.setDate(0);
  }
  return result;
}

function breakDownDuration(start: Date, end: Date): DurationBreakdown {
  if (end <= start) return { months: 0, weeks: 0, days: 0 };

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  let anchor = addMonths(start, months);
  if (anchor > end) {
    months -= 1;
    anchor = addMonths(start, months);
  }

  const remainingDays = Math.floor(
    (end.getTime() - anchor.getTime()) / MS_PER_DAY,
  );

  return {
    months,
    weeks: Math.floor(remainingDays / 7),
    days: remainingDays % 7,
  };
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

type PlanDuration = {
  total: DurationBreakdown;
  passed: DurationBreakdown;
  remaining: DurationBreakdown;
  progress: number;
  status: "upcoming" | "active" | "ended";
};

export function getPlanDuration(
  startDate: string,
  endDate: string,
  now: Date = new Date(),
): PlanDuration {
  const start = parseDateOnlyToLocal(startDate);
  const end = parseDateOnlyToLocal(endDate);
  const today = startOfDay(now);

  const total = breakDownDuration(start, end);
  const passed = breakDownDuration(start, today);
  const remaining = breakDownDuration(today, end);

  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / MS_PER_DAY),
  );
  const passedDays = Math.max(
    0,
    Math.round((today.getTime() - start.getTime()) / MS_PER_DAY),
  );
  const progress = Math.min(1, Math.max(0, passedDays / totalDays));

  let status: PlanDuration["status"] = "active";
  if (today < start) status = "upcoming";
  else if (today > end) status = "ended";

  return { total, passed, remaining, progress, status };
}
