import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  parsePagination,
  parseUserFilters,
} from "@/server/pipes/parse-pagination.pipe";
import { parseSelectUserQuery } from "@/server/modules/users/dto/select-user.dto";
import { userService } from "@/server/modules/users/user.service";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";
import type { SessionUserRequest } from "@/server/utils/request-user";

function ok<T>(
  data: T,
  meta?: PaginationMeta,
  status = 200,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export const userController = {
  async listUsers(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const pagination = parsePagination(searchParams);
    const filters = parseUserFilters(searchParams);
    const result = await userService.listUsers(
      pagination,
      filters,
      req.headers,
    );

    return ok(result.items, result.meta);
  },

  async select(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const query = parseSelectUserQuery(searchParams);
    const result = await userService.getSelectOptions(query);
    return ok(result.items, result.meta);
  },

  async getUserById(userId: string): Promise<NextResponse> {
    const result = await userService.getUserById(userId);
    return ok(result);
  },

  async deleteMyAccount(req: NextRequest): Promise<NextResponse> {
    const session = (req as SessionUserRequest).session;
    if (!session?.user?.id) {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    await userService.deleteMyAccount(session.user.id, req.headers);
    return ok({ success: true });
  },
};
