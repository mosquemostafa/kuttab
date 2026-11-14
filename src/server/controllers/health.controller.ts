import { NextResponse } from "next/server";

import type { ApiSuccess } from "@/shared/types/api-response.types";

export const healthController = {
  check(): NextResponse<ApiSuccess<{ status: string }>> {
    return NextResponse.json({
      success: true,
      data: { status: "ok" },
      timestamp: new Date().toISOString(),
    });
  },
};
