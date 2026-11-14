import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  avatarCompleteRequestSchema,
  avatarPresignRequestSchema,
} from "@/server/modules/users/avatar-r2.dto";
import { avatarR2Service } from "@/server/modules/users/avatar-r2.service";
import { validateBody } from "@/server/pipes/validate.pipe";
import { getUserId } from "@/server/utils/request-user";
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

export const avatarR2Controller = {
  async presign(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(avatarPresignRequestSchema, body);
    const userId = getUserId(req);
    const data = await avatarR2Service.presignUpload(userId, input);
    return ok(data);
  },

  async complete(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(avatarCompleteRequestSchema, body);
    const userId = getUserId(req);
    const data = await avatarR2Service.completeUpload(
      userId,
      input,
      req.headers,
    );
    return ok(data);
  },
};
