import { eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { segment } from "@/server/modules/segments/segment.entity";
import { user } from "@/server/modules/users/user.entity";
import { toInt } from "../../utils/cast";
import { type AdminOverviewRangeDays } from "@/shared/constants/admin-overview";

// Inclusive series window: range=7 means [anchor-6d, anchor].
function signupsSeriesLowerBoundSql(rangeDays: AdminOverviewRangeDays) {
  return sql`(${rangeDays - 1}::int * interval '1 day')`;
}

type UserTotalsRow = {
  total: number;
  newLast7Days: number;
  newLast30Days: number;
  verified: number;
  unverified: number;
  notBanned: number;
  bannedPermanent: number;
  bannedTemporary: number;
  unsegmented: number;
};

export const adminOverviewRepository = {
  async getUserAggregates(anchor: Date): Promise<UserTotalsRow> {
    const [row] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        newLast7Days: sql<number>`cast(count(*) filter (where ${user.createdAt} >= (${anchor}::timestamptz - interval '7 days')) as int)`,
        newLast30Days: sql<number>`cast(count(*) filter (where ${user.createdAt} >= (${anchor}::timestamptz - interval '30 days')) as int)`,
        verified: sql<number>`cast(count(*) filter (where ${user.emailVerified} = true) as int)`,
        unverified: sql<number>`cast(count(*) filter (where ${user.emailVerified} = false) as int)`,
        notBanned: sql<number>`cast(count(*) filter (where ${user.banned} is not true) as int)`,
        bannedPermanent: sql<number>`cast(count(*) filter (where ${user.banned} = true and ${user.banExpires} is null) as int)`,
        bannedTemporary: sql<number>`cast(count(*) filter (where ${user.banned} = true and ${user.banExpires} is not null) as int)`,
        unsegmented: sql<number>`cast(count(*) filter (where ${user.segmentId} is null) as int)`,
      })
      .from(user);

    return {
      total: toInt(row?.total),
      newLast7Days: toInt(row?.newLast7Days),
      newLast30Days: toInt(row?.newLast30Days),
      verified: toInt(row?.verified),
      unverified: toInt(row?.unverified),
      notBanned: toInt(row?.notBanned),
      bannedPermanent: toInt(row?.bannedPermanent),
      bannedTemporary: toInt(row?.bannedTemporary),
      unsegmented: toInt(row?.unsegmented),
    };
  },

  async getRoleDistribution(): Promise<{ roleKey: string; count: number }[]> {
    const roleGroup = sql<string>`coalesce(nullif(trim(${user.role}), ''), '__unspecified__')`;
    const rows = await db
      .select({
        roleKey: roleGroup,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(user)
      .groupBy(roleGroup)
      .orderBy(roleGroup);

    return rows.map((r) => ({
      roleKey: String(r.roleKey),
      count: toInt(r.count),
    }));
  },

  async getSegmentRows(): Promise<
    { segmentId: string; name: string; icon: string; userCount: number }[]
  > {
    const rows = await db
      .select({
        segmentId: segment.id,
        name: segment.name,
        icon: segment.icon,
        userCount: sql<number>`cast(count(${user.id}) as int)`,
      })
      .from(segment)
      .leftJoin(user, eq(user.segmentId, segment.id))
      .groupBy(segment.id, segment.name, segment.icon)
      .orderBy(segment.name);

    return rows.map((r) => ({
      segmentId: r.segmentId,
      name: r.name,
      icon: r.icon,
      userCount: toInt(r.userCount),
    }));
  },

  async getSignupsDailySeries(
    anchor: Date,
    rangeDays: AdminOverviewRangeDays,
  ): Promise<{ day: string; count: number }[]> {
    const lowerBoundSql = signupsSeriesLowerBoundSql(rangeDays);
    const rows = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${user.createdAt}), 'YYYY-MM-DD')`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(user)
      .where(
        sql`${user.createdAt} >= (${anchor}::timestamptz - ${lowerBoundSql})`,
      )
      .groupBy(sql`1`)
      .orderBy(sql`1`);

    return rows.map((r) => ({ day: r.day, count: toInt(r.count) }));
  },
};
