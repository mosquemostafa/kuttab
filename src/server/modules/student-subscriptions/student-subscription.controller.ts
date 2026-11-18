import { NextResponse, type NextRequest } from "next/server";

import {
  createStudentSubscriptionSchema,
  listStudentSubscriptionsQuerySchema,
  updateStudentSubscriptionSchema,
} from "@/server/modules/student-subscriptions/student-subscription.dto";
import { studentSubscriptionService } from "@/server/modules/student-subscriptions/student-subscription.service";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { validateBody } from "@/server/pipes/validate.pipe";
import type { ApiSuccess } from "@/shared/types/api-response.types";
import type { PaginationMeta } from "@/shared/types/pagination.types";

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

export const studentSubscriptionController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listStudentSubscriptionsQuerySchema.parse({
      studentId: searchParams.get("studentId") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      minAmount: searchParams.get("minAmount") ?? undefined,
      maxAmount: searchParams.get("maxAmount") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);

    const result = await studentSubscriptionService.listStudentSubscriptions(
      parsedQuery,
      pagination,
    );
    return ok(result.items, result.meta);
  },

  async getById(_req: NextRequest, id: string): Promise<NextResponse> {
    const result =
      await studentSubscriptionService.getStudentSubscriptionById(id);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createStudentSubscriptionSchema, body);
    const result =
      await studentSubscriptionService.createStudentSubscription(input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateStudentSubscriptionSchema, body);
    const result = await studentSubscriptionService.updateStudentSubscription(
      id,
      input,
    );
    return ok(result);
  },

  async delete(_req: NextRequest, id: string): Promise<NextResponse> {
    await studentSubscriptionService.deleteStudentSubscription(id);
    return new NextResponse(null, { status: 204 });
  },
};
