import { z } from "zod";

import { PAGINATION_DEFAULTS } from "@/server/constants/pagination";
import type { PaginationMeta } from "@/shared/types/pagination.types";

export const selectQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION_DEFAULTS.MAX_LIMIT)
    .default(20),
  includeArchived: z
    .preprocess((val) => {
      if (typeof val === "string") return val.toLowerCase() === "true";
      if (typeof val === "boolean") return val;
      return false;
    }, z.boolean())
    .optional()
    .default(false),
});

export type SelectQueryDTO = z.infer<typeof selectQuerySchema>;

export interface ParsedSelectQuery {
  q?: string;
  includeArchived: boolean;
  page: number;
  limit: number;
  offset: number;
}

export function parseSelectQuery(
  searchParams: URLSearchParams,
): ParsedSelectQuery {
  const parsed = selectQuerySchema.parse({
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    includeArchived: searchParams.get("includeArchived") ?? undefined,
  });

  return {
    q: parsed.q,
    includeArchived: parsed.includeArchived ?? false,
    page: parsed.page,
    limit: parsed.limit,
    offset: (parsed.page - 1) * parsed.limit,
  };
}

export function buildSelectMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export type {
  SelectQuery,
  SelectTitleItem,
  SelectNameItem,
  SelectUserQuery,
  SelectUserItem,
} from "@/shared/types/select.types";
