import type { NextRequest, NextResponse } from "next/server";

type RouteParams = Record<string, string>;

export type RouteContext = {
  params?: Promise<RouteParams> | RouteParams;
};

export async function resolveRouteParams(
  ctx?: RouteContext,
): Promise<RouteParams> {
  if (!ctx?.params) {
    return {};
  }

  return await Promise.resolve(ctx.params);
}

export type RouteHandler<
  TArgs extends [NextRequest, ...unknown[]] = [NextRequest, ...unknown[]],
> = (...args: TArgs) => Promise<NextResponse>;

type Wrapper = <TArgs extends [NextRequest, ...unknown[]]>(
  handler: RouteHandler<TArgs>,
) => RouteHandler<TArgs>;

export function compose(
  ...wrappers: Wrapper[]
): <TArgs extends [NextRequest, ...unknown[]]>(
  handler: RouteHandler<TArgs>,
) => RouteHandler<TArgs> {
  return <TArgs extends [NextRequest, ...unknown[]]>(
    handler: RouteHandler<TArgs>,
  ): RouteHandler<TArgs> =>
    wrappers.reduceRight(
      (currentHandler, wrapper) => wrapper(currentHandler),
      handler,
    );
}
