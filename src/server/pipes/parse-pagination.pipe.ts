import { PAGINATION_DEFAULTS } from "@/server/constants/pagination";

export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
}

export function parsePagination(
  searchParams: URLSearchParams,
): ParsedPagination {
  const page = Math.max(
    PAGINATION_DEFAULTS.PAGE,
    Number.parseInt(
      searchParams.get("page") ?? String(PAGINATION_DEFAULTS.PAGE),
      10,
    ) || PAGINATION_DEFAULTS.PAGE,
  );

  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(
      1,
      Number.parseInt(
        searchParams.get("limit") ?? String(PAGINATION_DEFAULTS.LIMIT),
        10,
      ) || PAGINATION_DEFAULTS.LIMIT,
    ),
  );

  return { page, limit, offset: (page - 1) * limit };
}

export interface ParsedUserFilters {
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  role?: string;
  status?: string;
  email?: string;
  name?: string;
  phone?: string;
}

export function parseUserFilters(
  searchParams: URLSearchParams,
): ParsedUserFilters {
  const sortDirection = searchParams.get("sortDirection");

  return {
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortDirection:
      sortDirection === "asc" || sortDirection === "desc"
        ? sortDirection
        : undefined,
    role: searchParams.get("role") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    email: searchParams.get("email") ?? undefined,
    name: searchParams.get("name") ?? undefined,
    phone: searchParams.get("phone") ?? undefined,
  };
}
