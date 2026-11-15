import { NextResponse, type NextRequest } from "next/server";

import { parseSelectQuery } from "@/server/dto/select-query.dto";
import {
  createStudentSchema,
  listStudentsQuerySchema,
  updateStudentSchema,
} from "@/server/modules/students/student.dto";
import { studentService } from "@/server/modules/students/student.service";
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

export const studentController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listStudentsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      studiedTajweed: searchParams.get("studiedTajweed") ?? undefined,
      previouslyEnrolled: searchParams.get("previouslyEnrolled") ?? undefined,
      minMemorizedParts: searchParams.get("minMemorizedParts") ?? undefined,
      maxMemorizedParts: searchParams.get("maxMemorizedParts") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);

    const result = await studentService.listStudents(parsedQuery, pagination);
    return ok(result.items, result.meta);
  },

  async getById(_req: NextRequest, id: string): Promise<NextResponse> {
    const result = await studentService.getStudentById(id);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createStudentSchema, body);
    const result = await studentService.createStudent(input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateStudentSchema, body);
    const result = await studentService.updateStudent(id, input);
    return ok(result);
  },

  async delete(_req: NextRequest, id: string): Promise<NextResponse> {
    await studentService.deleteStudent(id);
    return new NextResponse(null, { status: 204 });
  },

  async select(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const query = parseSelectQuery(searchParams);
    const result = await studentService.getSelectOptions(query);
    return ok(result.items, result.meta);
  },
};
