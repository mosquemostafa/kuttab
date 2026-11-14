import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { parseSelectQuery } from "@/server/dto/select-query.dto";
import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectAnalyticsQuerySchema,
  projectCountsQuerySchema,
  updateProjectSchema,
} from "@/server/modules/projects/project.dto";
import { projectService } from "@/server/modules/projects/project.service";
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

export const projectController = {
  async list(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = listProjectsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      isArchived: searchParams.get("isArchived") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const pagination = parsePagination(searchParams);
    const userId = getUserId(req);

    const result = await projectService.listProjects(
      userId,
      {
        q: parsedQuery.q,
        isArchived: parsedQuery.isArchived,
        sortBy: parsedQuery.sortBy,
      },
      pagination,
    );

    return ok(result.items, result.meta);
  },

  async getById(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await projectService.getProjectById(userId, id);
    return ok(result);
  },

  async counts(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = projectCountsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      isArchived: searchParams.get("isArchived") ?? undefined,
    });

    const userId = getUserId(req);
    const result = await projectService.getProjectCounts(userId, {
      q: parsedQuery.q,
      isArchived: parsedQuery.isArchived,
    });

    return ok(result);
  },

  async analytics(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const parsedQuery = projectAnalyticsQuerySchema.parse({
      projectId: searchParams.get("projectId") ?? undefined,
    });

    const userId = getUserId(req);
    const result = await projectService.getProjectContentAnalytics(userId, {
      projectId: parsedQuery.projectId,
    });

    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createProjectSchema, body);
    const userId = getUserId(req);
    const result = await projectService.createProject(userId, input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateProjectSchema, body);
    const userId = getUserId(req);
    const result = await projectService.updateProject(userId, id, input);
    return ok(result);
  },

  async archive(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await projectService.archiveProject(userId, id);
    return ok(result);
  },

  async unarchive(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    const result = await projectService.unarchiveProject(userId, id);
    return ok(result);
  },

  async delete(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    await projectService.deleteProject(userId, id);
    return new NextResponse(null, { status: 204 });
  },

  async select(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const query = parseSelectQuery(searchParams);
    const userId = getUserId(req);
    const result = await projectService.getSelectOptions(userId, query);
    return ok(result.items, result.meta);
  },
};
