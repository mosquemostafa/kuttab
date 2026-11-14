import { eachDayOfInterval, format, subDays } from "date-fns";

import { getDbTimeAnchor } from "@/server/db/time-anchor";
import { adminOverviewRepository } from "@/server/modules/admin-overview/admin-overview.repository";
import { type AdminOverviewRangeDays } from "@/shared/constants/admin-overview";
import type {
  AdminOverviewDailyPoint,
  AdminOverviewDTO,
  AdminOverviewRoleBucket,
} from "@/shared/types/admin-overview.types";

function mapRoleKey(raw: string): string {
  return raw === "__unspecified__" ? "unspecified" : raw;
}

function mergeDailySeries(
  rows: { day: string; count: number }[],
  end: Date,
  rangeDays: AdminOverviewRangeDays,
): AdminOverviewDailyPoint[] {
  const start = subDays(end, rangeDays - 1);
  const dates = eachDayOfInterval({ start, end });
  const map = new Map(rows.map((r) => [r.day, r.count] as const));
  return dates.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return { date: key, count: map.get(key) ?? 0 };
  });
}

export type AdminOverviewQuery = {
  rangeDays: AdminOverviewRangeDays;
};

export const adminOverviewService = {
  async getOverview(query: AdminOverviewQuery): Promise<AdminOverviewDTO> {
    const anchor = await getDbTimeAnchor();
    const { rangeDays } = query;

    const [userTotals, roleRows, segmentRows, signupsRaw] = await Promise.all([
      adminOverviewRepository.getUserAggregates(anchor),
      adminOverviewRepository.getRoleDistribution(),
      adminOverviewRepository.getSegmentRows(),
      adminOverviewRepository.getSignupsDailySeries(anchor, rangeDays),
    ]);

    const verified = userTotals.verified;
    const unverified = userTotals.unverified;
    const verifiedDenom = verified + unverified;
    const verifiedRatio =
      verifiedDenom > 0
        ? Math.round((verified / verifiedDenom) * 1000) / 1000
        : 0;

    const roles: AdminOverviewRoleBucket[] = roleRows.map((r) => ({
      key: mapRoleKey(r.roleKey),
      count: r.count,
    }));

    return {
      generatedAt: anchor.toISOString(),
      rangeDays,
      users: {
        totals: {
          total: userTotals.total,
          newLast7Days: userTotals.newLast7Days,
          newLast30Days: userTotals.newLast30Days,
        },
        emailVerified: {
          verified,
          unverified,
          verifiedRatio,
        },
        roles,
        banning: {
          notBanned: userTotals.notBanned,
          bannedPermanent: userTotals.bannedPermanent,
          bannedTemporary: userTotals.bannedTemporary,
        },
        segmentation: {
          unsegmented: userTotals.unsegmented,
          segments: segmentRows,
        },
      },
      series: {
        signupsByDay: mergeDailySeries(signupsRaw, anchor, rangeDays),
      },
    };
  },
};
