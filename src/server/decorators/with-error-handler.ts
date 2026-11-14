import type { NextRequest } from "next/server";

import { handleException } from "@/server/exceptions/exception-handler";
import type { RouteHandler } from "@/server/decorators/compose";

export function withErrorHandler<TArgs extends [NextRequest, ...unknown[]]>(
  handler: RouteHandler<TArgs>,
): RouteHandler<TArgs> {
  return (async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleException(error);
    }
  }) as RouteHandler<TArgs>;
}
