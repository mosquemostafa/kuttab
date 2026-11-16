import { z } from "zod";

import { PAGINATION_DEFAULTS } from "@/server/constants/pagination";

export const selectUserQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_DEFAULTS.MAX_LIMIT)
    .default(20),
});

export type SelectUserQueryDTO = z.infer<typeof selectUserQuerySchema>;

export interface ParsedSelectUserQuery {
  q?: string;
  role?: string;
  page: number;
  limit: number;
  offset: number;
}

export function parseSelectUserQuery(
  searchParams: URLSearchParams,
): ParsedSelectUserQuery {
  const parsed = selectUserQuerySchema.parse({
    q: searchParams.get("q") ?? undefined,
    role: searchParams.get("role") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  return {
    q: parsed.q,
    role: parsed.role,
    page: parsed.page,
    limit: parsed.limit,
    offset: (parsed.page - 1) * parsed.limit,
  };
}
