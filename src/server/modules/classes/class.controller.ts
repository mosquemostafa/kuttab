import { NextResponse, type NextRequest } from "next/server";

import { parseSelectQuery } from "@/server/dto/select-query.dto";
import {
  createClassSchema,
  listClassesQuerySchema,
  updateClassSchema,
} from "@/server/modules/classes/class.dto";
import { classService } from "@/server/modules/classes/class.service";
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

export const classController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listClassesQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      primaryTeacherId: searchParams.get("primaryTeacherId") ?? undefined,
      secondaryTeacherId: searchParams.get("secondaryTeacherId") ?? undefined,
      teacherId: searchParams.get("teacherId") ?? undefined,
      classType: searchParams.get("classType") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);

    const result = await classService.listClasses(parsedQuery, pagination);
    return ok(result.items, result.meta);
  },

  async getById(_req: NextRequest, id: string): Promise<NextResponse> {
    const result = await classService.getClassById(id);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createClassSchema, body);
    const result = await classService.createClass(input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateClassSchema, body);
    const result = await classService.updateClass(id, input);
    return ok(result);
  },

  async delete(_req: NextRequest, id: string): Promise<NextResponse> {
    await classService.deleteClass(id);
    return new NextResponse(null, { status: 204 });
  },

  async select(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const query = parseSelectQuery(searchParams);
    const result = await classService.getSelectOptions(query);
    return ok(result.items, result.meta);
  },
};
