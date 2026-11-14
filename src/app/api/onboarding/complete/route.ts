/**
 * @swagger
 * /api/onboarding/complete:
 *   post:
 *     summary: Mark the current user as onboarded
 *     tags:
 *       - Onboarding
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User marked as onboarded
 *       401:
 *         description: Unauthorized
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { compose } from "@/server/decorators/compose";
import { withErrorHandler } from "@/server/decorators/with-error-handler";
import { withAuth } from "@/server/guards/auth.guard";
import { userService } from "@/server/modules/users/user.service";
import type { ApiSuccess } from "@/shared/types/api-response.types";

const wrap = compose(withErrorHandler, withAuth);

function ok(): NextResponse<ApiSuccess<null>> {
  return NextResponse.json(
    {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

export const POST = wrap(async (req: NextRequest) => {
  await userService.completeOnboarding(req.headers);
  return ok();
});
