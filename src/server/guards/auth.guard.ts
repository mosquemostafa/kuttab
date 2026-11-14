import type { NextRequest } from "next/server";

import { auth } from "@/server/lib/auth";
import type { RouteHandler } from "@/server/decorators/compose";
import { UnauthorizedException } from "@/server/exceptions/exceptions";

export function withAuth<TArgs extends [NextRequest, ...unknown[]]>(
  handler: RouteHandler<TArgs>,
): RouteHandler<TArgs> {
  return (async (...args: TArgs) => {
    const [req] = args;
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user?.id) {
      throw new UnauthorizedException();
    }

    (req as NextRequest & { session: typeof session }).session = session;
    return handler(...args);
  }) as RouteHandler<TArgs>;
}
