import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  adminOverviewService,
  type AdminOverviewQuery,
} from "@/server/modules/admin-overview/admin-overview.service";
import { ValidationException } from "@/server/exceptions/exceptions";
import type { AdminOverviewRangeDays } from "@/shared/constants/admin-overview";
import type { ApiSuccess } from "@/shared/types/api-response.types";

const overviewQuerySchema = z
  .object({
    range: z.enum(["7", "30"]).optional(),
  })
  .transform(
    (o): AdminOverviewQuery => ({
      rangeDays: (o.range === "7" ? 7 : 30) as AdminOverviewRangeDays,
    }),
  );

function parseOverviewQuery(req: NextRequest): AdminOverviewQuery {
  const { searchParams } = new URL(req.url);
  const raw = {
    range: searchParams.get("range") ?? undefined,
  };
  const parsed = overviewQuerySchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationException(parsed.error.flatten());
  }
  return parsed.data;
}

export const adminOverviewController = {
  async getOverview(req: NextRequest): Promise<NextResponse> {
    const query = parseOverviewQuery(req);
    const data = await adminOverviewService.getOverview(query);
    const body: ApiSuccess<typeof data> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(body);
  },
};
