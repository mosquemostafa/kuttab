import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createSegmentSchema,
  listSegmentsQuerySchema,
  updateSegmentSchema,
} from "@/server/modules/segments/segment.dto";
import { segmentService } from "@/server/modules/segments/segment.service";
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

export const segmentController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);

    const parsed = listSegmentsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const pagination = parsePagination(searchParams);

    const result = await segmentService.listSegments(
      pagination,
      parsed.q,
      "desc",
    );

    return ok(result.items, result.meta);
  },

  async getById(id: string): Promise<NextResponse> {
    const result = await segmentService.getSegmentById(id);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createSegmentSchema, body);
    const result = await segmentService.createSegment(input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateSegmentSchema, body);
    const result = await segmentService.updateSegment(id, input);
    return ok(result);
  },

  async delete(id: string): Promise<NextResponse> {
    await segmentService.deleteSegment(id);
    return new NextResponse(null, { status: 204 });
  },
};
