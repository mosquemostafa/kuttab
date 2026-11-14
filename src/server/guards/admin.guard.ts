import type { NextRequest } from "next/server";

import { auth } from "@/server/lib/auth";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { RouteHandler } from "@/server/decorators/compose";
import {
  ForbiddenException,
  UnauthorizedException,
} from "@/server/exceptions/exceptions";

export function withAdmin<TArgs extends [NextRequest, ...unknown[]]>(
  handler: RouteHandler<TArgs>,
): RouteHandler<TArgs> {
  return (async (...args: TArgs) => {
    const [req] = args;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      throw new UnauthorizedException();
    }

    if (session.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    (req as NextRequest & { session: typeof session }).session = session;
    return handler(...args);
  }) as RouteHandler<TArgs>;
}
