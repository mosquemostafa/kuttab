import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { supportStaffOverviewService } from "@/server/modules/support-staff-overview/support-staff-overview.service";
import type { ApiSuccess } from "@/shared/types/api-response.types";

export const supportStaffOverviewController = {
  async getOverview(_req: NextRequest): Promise<NextResponse> {
    const data = await supportStaffOverviewService.getOverview();
    const body: ApiSuccess<typeof data> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(body);
  },
};
