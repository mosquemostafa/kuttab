import { NextResponse, type NextRequest } from "next/server";

import { parseSelectQuery } from "@/server/dto/select-query.dto";
import {
  createTeacherSchema,
  listTeachersQuerySchema,
  updateTeacherSchema,
} from "@/server/modules/teachers/teacher.dto";
import { teacherService } from "@/server/modules/teachers/teacher.service";
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

export const teacherController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listTeachersQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      studentType: searchParams.get("studentType") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);

    const result = await teacherService.listTeachers(parsedQuery, pagination);
    return ok(result.items, result.meta);
  },

  async getById(_req: NextRequest, id: string): Promise<NextResponse> {
    const result = await teacherService.getTeacherById(id);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createTeacherSchema, body);
    const result = await teacherService.createTeacher(input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateTeacherSchema, body);
    const result = await teacherService.updateTeacher(id, input);
    return ok(result);
  },

  async delete(_req: NextRequest, id: string): Promise<NextResponse> {
    await teacherService.deleteTeacher(id);
    return new NextResponse(null, { status: 204 });
  },

  async select(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const query = parseSelectQuery(searchParams);
    const result = await teacherService.getSelectOptions(query);
    return ok(result.items, result.meta);
  },
};
