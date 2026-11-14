import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";
import { updateAppSettingsSchema } from "@/server/modules/app-settings/app-settings.dto";
import { validateBody } from "@/server/pipes/validate.pipe";
import type { ApiSuccess } from "@/shared/types/api-response.types";

function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const appSettingsController = {
  async getSettings(): Promise<NextResponse> {
    const settings = await appSettingsService.getSettings();
    return ok(settings);
  },

  async updateSettings(req: NextRequest): Promise<NextResponse> {
    const raw = await req.json();
    const body = validateBody(updateAppSettingsSchema, raw);
    const updated = await appSettingsService.updateSettings(body);
    return ok(updated);
  },
};
