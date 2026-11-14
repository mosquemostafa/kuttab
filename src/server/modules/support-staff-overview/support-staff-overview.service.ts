import { eachDayOfInterval, format, subDays } from "date-fns";

import { getDbTimeAnchor } from "@/server/db/time-anchor";
import { supportStaffOverviewRepository } from "@/server/modules/support-staff-overview/support-staff-overview.repository";
import {
  STALE_DAYS,
  SUPPORT_OVERVIEW_SERIES_DAYS,
} from "@/shared/constants/support";
import type { SupportStaffOverviewDTO } from "@/shared/types/support-staff-overview.types";

function mergeDailySeries(
  ticketRows: { day: string; count: number }[],
  feedbackRows: { day: string; count: number }[],
  end: Date,
): SupportStaffOverviewDTO["series"] {
  const start = subDays(end, SUPPORT_OVERVIEW_SERIES_DAYS - 1);
  const dates = eachDayOfInterval({ start, end });
  const ticketMap = new Map(ticketRows.map((r) => [r.day, r.count] as const));
  const feedbackMap = new Map(
    feedbackRows.map((r) => [r.day, r.count] as const),
  );

  return dates.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return {
      date: key,
      tickets: ticketMap.get(key) ?? 0,
      feedbacks: feedbackMap.get(key) ?? 0,
    };
  });
}

export const supportStaffOverviewService = {
  async getOverview(): Promise<SupportStaffOverviewDTO> {
    const anchor = await getDbTimeAnchor();
    const [ticketRow, feedbackRow, ticketDaily, feedbackDaily] =
      await Promise.all([
        supportStaffOverviewRepository.getTicketAggregates(anchor),
        supportStaffOverviewRepository.getFeedbackAggregates(anchor),
        supportStaffOverviewRepository.getSupportTicketDailyCreatedForSeries(
          anchor,
        ),
        supportStaffOverviewRepository.getFeedbackDailyCreatedForSeries(anchor),
      ]);

    return {
      generatedAt: anchor.toISOString(),
      staleDays: STALE_DAYS,
      series: mergeDailySeries(ticketDaily, feedbackDaily, anchor),
      tickets: supportStaffOverviewRepository.mapTicketRow(ticketRow),
      feedbacks: supportStaffOverviewRepository.mapFeedbackRow(feedbackRow),
    };
  },
};
