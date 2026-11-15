import type { NextRequest } from "next/server";

import { auth } from "@/server/lib/auth";
import { normalizeUserRole, UserRole } from "@/shared/enums/user-role.enum";
import type { RouteHandler } from "@/server/decorators/compose";
import {
  ForbiddenException,
  UnauthorizedException,
} from "@/server/exceptions/exceptions";

function isContentManagerRole(role: string | null | undefined): boolean {
  const normalized = normalizeUserRole(role);
  return normalized === UserRole.ADMIN || normalized === UserRole.CONTENT;
}

export function withContentManager<TArgs extends [NextRequest, ...unknown[]]>(
  handler: RouteHandler<TArgs>,
): RouteHandler<TArgs> {
  return (async (...args: TArgs) => {
    const [req] = args;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      throw new UnauthorizedException();
    }

    if (!isContentManagerRole(session.user.role)) {
      throw new ForbiddenException();
    }

    (req as NextRequest & { session: typeof session }).session = session;
    return handler(...args);
  }) as RouteHandler<TArgs>;
}
