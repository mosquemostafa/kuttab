export function parseDateOnlyToLocal(value: string): Date {
  const [year, month, day] = value.split("-").map((part) => Number(part));

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day);
}

/**
 * Returns the effective date for an event's end time.
 * If the end time is specifically "00:00" (12:00 AM / midnight),
 * it treats the end date as scheduledDate + 1 day.
 */
function getScheduledEndDate(
  scheduledDate: string,
  endTime?: string | null,
): string {
  if (endTime === "00:00") {
    const [year, month, day] = scheduledDate.split("-").map(Number);
    const nextDate = new Date(year, month - 1, day + 1, 12, 0, 0);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
    const dd = String(nextDate.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return scheduledDate;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Pure Wall-Clock Time Utilities
 *
 * For a personal calendar, events are pure wall-clock time. If a user creates
 * an event at 5:30 AM, it is stored as 05:30 wall-clock time (represented as
 * YYYY-MM-DDTHH:mm:00.000Z where the time part is the literal wall-clock time).
 * Formatting uses UTC so that no browser timezone offset shifts the hours/minutes.
 * ────────────────────────────────────────────────────────────────────────── */

type WallClockTimeParts = {
  hour: string;
  minute: string;
  second: string;
  year: number;
  month: number;
  day: number;
  totalMinutes: number;
  timeString: string;
};

/**
 * Extracts wall-clock time parts from an ISO string.
 * Uses the timestamp's UTC digits directly as literal wall-clock time.
 */
export function getWallClockTimeParts(
  value?: string | null,
): WallClockTimeParts {
  if (!value) {
    return {
      hour: "00",
      minute: "00",
      second: "00",
      year: 0,
      month: 0,
      day: 0,
      totalMinutes: 0,
      timeString: "00:00",
    };
  }

  const d = new Date(value);
  const hourNum = d.getUTCHours();
  const minNum = d.getUTCMinutes();
  const secNum = d.getUTCSeconds();
  const hourStr = String(hourNum).padStart(2, "0");
  const minStr = String(minNum).padStart(2, "0");
  const secStr = String(secNum).padStart(2, "0");

  return {
    hour: hourStr,
    minute: minStr,
    second: secStr,
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    totalMinutes: hourNum * 60 + minNum,
    timeString: `${hourStr}:${minStr}`,
  };
}

/**
 * Formats a wall-clock time (either minute count 0..1440 or an ISO string)
 * using UTC Intl.DateTimeFormat so zero browser timezone offset is applied.
 */
export function formatWallClockTime(
  value: string | number,
  locale: string,
): string {
  if (typeof value === "number") {
    const normalized = ((value % 1440) + 1440) % 1440;
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    const d = new Date(Date.UTC(2020, 0, 1, h, m, 0));
    return new Intl.DateTimeFormat(locale, {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  }

  // Handle ISO string
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

/**
 * Formats a time range (start to end minutes) with localized duration label.
 */
export function formatWallClockRange(
  startMinutes: number,
  endMinutes: number,
  locale: string,
): string {
  const startStr = formatWallClockTime(startMinutes, locale);
  const endStr =
    endMinutes === 1440
      ? formatWallClockTime(0, locale) // Midnight / 12:00 AM
      : formatWallClockTime(endMinutes, locale);

  const durationMin = Math.max(0, endMinutes - startMinutes);
  const durationHours = Math.floor(durationMin / 60);
  const remMinutes = durationMin % 60;
  const isAr = locale.toLowerCase().startsWith("ar");

  let durStr = "";
  if (durationHours > 0 && remMinutes > 0) {
    durStr = `${durationHours}${isAr ? "س" : "h"} ${remMinutes}${isAr ? "د" : "m"}`;
  } else if (durationHours > 0) {
    durStr = `${durationHours}${isAr ? "س" : "h"}`;
  } else {
    durStr = `${remMinutes}${isAr ? "د" : "m"}`;
  }

  return `${startStr} – ${endStr} (${durStr})`;
}

/**
 * Constructs a canonical wall-clock ISO string from a date string (YYYY-MM-DD)
 * and 24h time string (HH:mm). The resulting string uses "Z" where the clock
 * digits represent the literal wall-clock time.
 */
export function formatWallClockISO(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
}

/**
 * Returns the effective ISO string for an event's scheduled end time.
 * If endTime is "00:00", it rolls over to next day's 00:00:00.000Z.
 */
export function getWallClockEndISO(date: string, endTime: string): string {
  if (endTime === "00:00") {
    const nextDay = getScheduledEndDate(date, "00:00");
    return `${nextDay}T00:00:00.000Z`;
  }
  return `${date}T${endTime}:00.000Z`;
}

/**
 * Checks whether an end time is invalid relative to a start time on the same date.
 * "00:00" is treated as midnight at the end of the day (valid).
 */
export function isWallClockEndInvalid(start: string, end: string): boolean {
  if (!start || !end) return false;
  if (start === end) return true;
  if (end === "00:00") return false;
  return end <= start;
}
