import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { userService } from "@/server/modules/users/user.service";
import { getUserId } from "@/server/utils/request-user";
import {
  changePasswordSchema,
  setPasswordSchema,
  updateProfileSchema,
} from "@/server/modules/dashboard-settings/dashboard-settings.dto";
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

export const dashboardSettingsController = {
  async getOverview(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await userService.getDashboardSettingsOverview(userId);
    return ok(result);
  },

  async updateProfile(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const raw = await req.json();
    const body = validateBody(updateProfileSchema, raw);
    await userService.updateUserProfile(
      userId,
      { name: body.name, phone: body.phone },
      req.headers,
    );
    return ok({ updated: true });
  },

  async changePassword(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const raw = await req.json();
    const body = validateBody(changePasswordSchema, raw);
    await userService.changeUserPassword(
      userId,
      body.currentPassword,
      body.newPassword,
      req.headers,
    );
    return ok({ updated: true });
  },

  async setPassword(req: NextRequest): Promise<NextResponse> {
    const userId = getUserId(req);
    const raw = await req.json();
    const body = validateBody(setPasswordSchema, raw);
    await userService.setUserPassword(userId, body.newPassword, req.headers);
    return ok({ updated: true });
  },
};
