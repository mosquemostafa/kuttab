/** Allowed `range` query values: inclusive calendar days for daily series + rolling windows. */
export const ADMIN_OVERVIEW_RANGE_DAYS = [7, 30] as const;
export type AdminOverviewRangeDays = (typeof ADMIN_OVERVIEW_RANGE_DAYS)[number];
