import { NextResponse, type NextRequest } from "next/server";

import {
  bulkAttendanceActionSchema,
  dailyAttendanceQuerySchema,
  listTeacherAttendancesQuerySchema,
  salaryReportQuerySchema,
  toggleTeacherAttendanceSchema,
  updateTeacherAttendanceSchema,
  weeklyAttendanceQuerySchema,
} from "@/server/modules/teacher-attendances/teacher-attendance.dto";
import { teacherAttendanceService } from "@/server/modules/teacher-attendances/teacher-attendance.service";
import { parsePagination } from "@/server/pipes/parse-pagination.pipe";
import { validateBody } from "@/server/pipes/validate.pipe";
import { getUserId } from "@/server/utils/request-user";
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

export async function getTeacherSalaryReport(
  req: NextRequest,
): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const parsedQuery = salaryReportQuerySchema.parse({
    month: searchParams.get("month") ?? undefined,
  });

  const result =
    await teacherAttendanceService.getMonthlySalaryReport(parsedQuery);
  return ok(result);
}

export const teacherAttendanceController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listTeacherAttendancesQuerySchema.parse({
      teacherId: searchParams.get("teacherId") ?? undefined,
      date: searchParams.get("date") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      latenessPeriod: searchParams.get("latenessPeriod") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    const pagination = parsePagination(searchParams);

    const result = await teacherAttendanceService.listAttendances(
      parsedQuery,
      pagination,
    );
    return ok(result.items, result.meta);
  },

  async getById(_req: NextRequest, id: string): Promise<NextResponse> {
    const result = await teacherAttendanceService.getAttendanceById(id);
    return ok(result);
  },

  async daily(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = dailyAttendanceQuerySchema.parse({
      date: searchParams.get("date") ?? undefined,
    });

    const result = await teacherAttendanceService.getDailyAttendance(parsedQuery);
    return ok(result);
  },

  async weekly(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = weeklyAttendanceQuerySchema.parse({
      startDate: searchParams.get("startDate") ?? undefined,
    });

    const result =
      await teacherAttendanceService.getWeeklyAttendance(parsedQuery);
    return ok(result);
  },

  salaryReport: getTeacherSalaryReport,

  async toggle(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(toggleTeacherAttendanceSchema, body);
    const recordedBy = getUserId(req);

    const result = await teacherAttendanceService.toggleAttendance(
      recordedBy,
      input,
    );
    return ok(result);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateTeacherAttendanceSchema, body);

    const result = await teacherAttendanceService.updateAttendance(id, input);
    return ok(result);
  },

  async delete(_req: NextRequest, id: string): Promise<NextResponse> {
    await teacherAttendanceService.deleteAttendance(id);
    return new NextResponse(null, { status: 204 });
  },

  async markAllAttended(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(bulkAttendanceActionSchema, body);
    const recordedBy = getUserId(req);

    const result = await teacherAttendanceService.markAllAttended(
      recordedBy,
      input.date,
    );
    return ok(result);
  },

  async markAllAbsent(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(bulkAttendanceActionSchema, body);

    const result = await teacherAttendanceService.markAllAbsent(input.date);
    return ok(result);
  },
};
