/**
 * Pure date and duration calculation utilities.
 * Independent of React or UI frameworks.
 */

/**
 * Splits total minutes into whole hours and remaining minutes.
 * Handles negative or null/undefined inputs safely.
 */
export function splitMinutes(totalMinutes: number | null | undefined): {
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes ?? 0));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  return { hours, minutes, totalMinutes: safeMinutes };
}

/**
 * Splits total days into months (approx. 30 days) and remaining days.
 * Useful for high-level duration breakdowns (e.g. "2 mo, 5 d").
 */
export function splitDays(totalDays: number | null | undefined): {
  months: number;
  days: number;
  totalDays: number;
} {
  const safeDays = Math.max(0, Math.floor(totalDays ?? 0));
  const months = Math.floor(safeDays / 30);
  const days = safeDays % 30;

  return { months, days, totalDays: safeDays };
}

/**
 * Calculates the elapsed calendar days between two dates.
 * Returns null if either date is missing, invalid, or if endDate is earlier than startDate.
 */
export function calculateDaysBetween(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined,
): number | null {
  if (!startDate || !endDate) return null;

  const startMs =
    typeof startDate === "string" ? Date.parse(startDate) : startDate.getTime();
  const endMs =
    typeof endDate === "string" ? Date.parse(endDate) : endDate.getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return null;
  }

  return Math.round((endMs - startMs) / 86400000);
}
