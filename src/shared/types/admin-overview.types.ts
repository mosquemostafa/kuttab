import type { AdminOverviewRangeDays } from "@/shared/constants/admin-overview";

export type AdminOverviewRoleBucket = {
  /** `UserRole` value or `"unspecified"` when `user.role` is null. */
  key: string;
  count: number;
};

export type AdminOverviewSegmentRow = {
  segmentId: string;
  name: string;
  icon: string;
  userCount: number;
};

export type AdminOverviewDailyPoint = {
  date: string;
  count: number;
};

export type AdminOverviewDTO = {
  generatedAt: string;
  rangeDays: AdminOverviewRangeDays;
  users: {
    totals: {
      total: number;
      newLast7Days: number;
      newLast30Days: number;
    };
    emailVerified: {
      verified: number;
      unverified: number;
      verifiedRatio: number;
    };
    roles: AdminOverviewRoleBucket[];
    banning: {
      notBanned: number;
      bannedPermanent: number;
      bannedTemporary: number;
    };
    segmentation: {
      unsegmented: number;
      segments: AdminOverviewSegmentRow[];
    };
  };
  series: {
    signupsByDay: AdminOverviewDailyPoint[];
  };
};
