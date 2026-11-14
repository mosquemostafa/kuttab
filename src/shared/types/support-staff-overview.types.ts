/** One row per calendar day per `SUPPORT_OVERVIEW_SERIES_DAYS`; chart range is sliced client-side. */
export type SupportOverviewDailyPoint = {
  date: string;
  tickets: number;
  feedbacks: number;
};

export type SupportStaffOverviewDTO = {
  generatedAt: string;
  staleDays: number;
  series: SupportOverviewDailyPoint[];
  tickets: {
    /** Always `open + resolved + closed + byStatus.other` (single-scan buckets). */
    total: number;
    byStatus: {
      open: number;
      resolved: number;
      closed: number;
      /** Rows whose status is not one of the known values (enum drift / bad data). */
      other: number;
    };
    created: {
      last7Days: number;
      last30Days: number;
    };
    /** Open tickets with `created_at` older than `staleDays`. */
    openStale: number;
    /** Tickets moved to resolved/closed with `updated_at` in window (throughput signal). */
    resolvedOrClosedUpdated: {
      last7Days: number;
      last30Days: number;
    };
  };
  feedbacks: {
    /** Always `new + reviewed + closed + byStatus.other`. */
    total: number;
    byStatus: {
      new: number;
      reviewed: number;
      closed: number;
      other: number;
    };
    /** `suggestion + complaint + other` equals row count when types are exhaustive. */
    byType: {
      suggestion: number;
      complaint: number;
      other: number;
    };
    created: {
      last7Days: number;
      last30Days: number;
    };
    /** Status `new` with `created_at` older than `staleDays`. */
    staleNew: number;
  };
};
