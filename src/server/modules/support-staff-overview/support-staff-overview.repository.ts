import { sql } from "drizzle-orm";

import { db } from "@/server/db";
import { feedback } from "@/server/modules/feedbacks/feedback.entity";
import { supportTicket } from "@/server/modules/support-tickets/support-ticket.entity";
import {
  STALE_DAYS,
  SUPPORT_OVERVIEW_SERIES_DAYS,
} from "@/shared/constants/support";

/** Derived from `STALE_DAYS` so SQL and DTO stay aligned. */
const staleInterval = sql`(${STALE_DAYS}::int * interval '1 day')`;

/** Anchor minus interval — explicit `::timestamptz` avoids PG parsing `col >= $1 - interval` as `timestamp >= interval`. */
function anchorMinusInterval(anchor: Date, days: 7 | 30) {
  const interval =
    days === 7 ? sql`interval '7 days'` : sql`interval '30 days'`;
  return sql`(${anchor}::timestamptz - ${interval})`;
}

function anchorMinusStaleWindow(anchor: Date) {
  return sql`(${anchor}::timestamptz - ${staleInterval})`;
}

/** Extend when another table needs the same daily `created_at` series. */
type PgTableWithCreatedAt = typeof supportTicket | typeof feedback;

function dailySeriesWindowSql(days: number) {
  return sql`(${days - 1}::int * interval '1 day')`;
}

/** @deprecated Use `getDbTimeAnchor` from `@/server/db/time-anchor` */

async function getDailyCreatedSeries(
  table: PgTableWithCreatedAt,
  anchor: Date,
  days: number,
): Promise<{ day: string; count: number }[]> {
  const windowSql = dailySeriesWindowSql(days);
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${table.createdAt}), 'YYYY-MM-DD')`,
      count: sql`count(*)`,
    })
    .from(table)
    .where(sql`${table.createdAt} >= (${anchor}::timestamptz - ${windowSql})`)
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  return rows.map((r) => ({ day: r.day, count: toInt(r.count) }));
}

/** Single table scan per query using PostgreSQL `COUNT(*) FILTER`. */
type TicketAggRow = {
  open: unknown;
  resolved: unknown;
  closed: unknown;
  otherStatus: unknown;
  createdLast7d: unknown;
  createdLast30d: unknown;
  openStale: unknown;
  resolvedOrClosedUpdatedLast7d: unknown;
  resolvedOrClosedUpdatedLast30d: unknown;
};

type FeedbackAggRow = {
  newCount: unknown;
  reviewed: unknown;
  closed: unknown;
  otherStatus: unknown;
  suggestion: unknown;
  complaint: unknown;
  otherType: unknown;
  createdLast7d: unknown;
  createdLast30d: unknown;
  staleNew: unknown;
};

function toInt(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number.parseInt(value, 10) || 0;
  return Number(value) || 0;
}

export const supportStaffOverviewRepository = {
  getSupportTicketDailyCreatedForSeries(anchor: Date) {
    return getDailyCreatedSeries(
      supportTicket,
      anchor,
      SUPPORT_OVERVIEW_SERIES_DAYS,
    );
  },

  getFeedbackDailyCreatedForSeries(anchor: Date) {
    return getDailyCreatedSeries(
      feedback,
      anchor,
      SUPPORT_OVERVIEW_SERIES_DAYS,
    );
  },

  async getTicketAggregates(anchor: Date): Promise<TicketAggRow> {
    const [row] = await db
      .select({
        open: sql<number>`cast(count(*) filter (where ${supportTicket.status} = 'open') as int)`,
        resolved: sql<number>`cast(count(*) filter (where ${supportTicket.status} = 'resolved') as int)`,
        closed: sql<number>`cast(count(*) filter (where ${supportTicket.status} = 'closed') as int)`,
        otherStatus: sql<number>`cast(count(*) filter (where ${supportTicket.status} not in ('open', 'resolved', 'closed')) as int)`,
        createdLast7d: sql<number>`cast(count(*) filter (where ${supportTicket.createdAt} >= ${anchorMinusInterval(anchor, 7)}) as int)`,
        createdLast30d: sql<number>`cast(count(*) filter (where ${supportTicket.createdAt} >= ${anchorMinusInterval(anchor, 30)}) as int)`,
        openStale: sql<number>`cast(count(*) filter (where ${supportTicket.status} = 'open' and ${supportTicket.createdAt} < ${anchorMinusStaleWindow(anchor)}) as int)`,
        resolvedOrClosedUpdatedLast7d: sql<number>`cast(count(*) filter (where ${supportTicket.status} in ('resolved', 'closed') and ${supportTicket.updatedAt} >= ${anchorMinusInterval(anchor, 7)}) as int)`,
        resolvedOrClosedUpdatedLast30d: sql<number>`cast(count(*) filter (where ${supportTicket.status} in ('resolved', 'closed') and ${supportTicket.updatedAt} >= ${anchorMinusInterval(anchor, 30)}) as int)`,
      })
      .from(supportTicket);

    return (
      row ?? {
        open: 0,
        resolved: 0,
        closed: 0,
        otherStatus: 0,
        createdLast7d: 0,
        createdLast30d: 0,
        openStale: 0,
        resolvedOrClosedUpdatedLast7d: 0,
        resolvedOrClosedUpdatedLast30d: 0,
      }
    );
  },

  async getFeedbackAggregates(anchor: Date): Promise<FeedbackAggRow> {
    const [row] = await db
      .select({
        newCount: sql<number>`cast(count(*) filter (where ${feedback.status} = 'new') as int)`,
        reviewed: sql<number>`cast(count(*) filter (where ${feedback.status} = 'reviewed') as int)`,
        closed: sql<number>`cast(count(*) filter (where ${feedback.status} = 'closed') as int)`,
        otherStatus: sql<number>`cast(count(*) filter (where ${feedback.status} not in ('new', 'reviewed', 'closed')) as int)`,
        suggestion: sql<number>`cast(count(*) filter (where ${feedback.type} = 'suggestion') as int)`,
        complaint: sql<number>`cast(count(*) filter (where ${feedback.type} = 'complaint') as int)`,
        otherType: sql<number>`cast(count(*) filter (where ${feedback.type} not in ('suggestion', 'complaint')) as int)`,
        createdLast7d: sql<number>`cast(count(*) filter (where ${feedback.createdAt} >= ${anchorMinusInterval(anchor, 7)}) as int)`,
        createdLast30d: sql<number>`cast(count(*) filter (where ${feedback.createdAt} >= ${anchorMinusInterval(anchor, 30)}) as int)`,
        staleNew: sql<number>`cast(count(*) filter (where ${feedback.status} = 'new' and ${feedback.createdAt} < ${anchorMinusStaleWindow(anchor)}) as int)`,
      })
      .from(feedback);

    return (
      row ?? {
        newCount: 0,
        reviewed: 0,
        closed: 0,
        otherStatus: 0,
        suggestion: 0,
        complaint: 0,
        otherType: 0,
        createdLast7d: 0,
        createdLast30d: 0,
        staleNew: 0,
      }
    );
  },

  mapTicketRow(row: TicketAggRow) {
    const open = toInt(row.open);
    const resolved = toInt(row.resolved);
    const closed = toInt(row.closed);
    const other = toInt(row.otherStatus);

    return {
      total: open + resolved + closed + other,
      byStatus: {
        open,
        resolved,
        closed,
        other,
      },
      created: {
        last7Days: toInt(row.createdLast7d),
        last30Days: toInt(row.createdLast30d),
      },
      openStale: toInt(row.openStale),
      resolvedOrClosedUpdated: {
        last7Days: toInt(row.resolvedOrClosedUpdatedLast7d),
        last30Days: toInt(row.resolvedOrClosedUpdatedLast30d),
      },
    };
  },

  mapFeedbackRow(row: FeedbackAggRow) {
    const newCount = toInt(row.newCount);
    const reviewed = toInt(row.reviewed);
    const closed = toInt(row.closed);
    const otherStatus = toInt(row.otherStatus);

    const suggestion = toInt(row.suggestion);
    const complaint = toInt(row.complaint);
    const otherType = toInt(row.otherType);

    return {
      total: newCount + reviewed + closed + otherStatus,
      byStatus: {
        new: newCount,
        reviewed,
        closed,
        other: otherStatus,
      },
      byType: {
        suggestion,
        complaint,
        other: otherType,
      },
      created: {
        last7Days: toInt(row.createdLast7d),
        last30Days: toInt(row.createdLast30d),
      },
      staleNew: toInt(row.staleNew),
    };
  },
};
