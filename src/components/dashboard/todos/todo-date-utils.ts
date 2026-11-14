import { format } from "date-fns";

/** Local calendar day as `YYYY-MM-dd` (for new values from `Date` pickers / `startOfDay`). */
export function toDateOnlyString(value: Date): string {
  return format(value, "yyyy-MM-dd");
}

export function parseDateOnlyToLocal(value: string): Date {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day);
}
