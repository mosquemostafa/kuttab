import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createBlogCommentSchema,
  listBlogCommentsQuerySchema,
  updateBlogCommentSchema,
} from "@/server/modules/blog-comments/blog-comment.dto";
import { blogCommentService } from "@/server/modules/blog-comments/blog-comment.service";
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

export const blogCommentController = {
  async listBySlug(req: NextRequest, slug: string): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const pagination = parsePagination(searchParams);

    listBlogCommentsQuerySchema.parse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await blogCommentService.listByPublishedBlogSlug(
      slug,
      pagination.page,
      pagination.limit,
    );

    return ok(result.items, result.meta);
  },

  async create(req: NextRequest, slug: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createBlogCommentSchema, body);
    const userId = getUserId(req);
    const result = await blogCommentService.createOnPublishedBlog(
      slug,
      userId,
      input,
    );
    return ok(result, undefined, 201);
  },

  async updateForOwner(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateBlogCommentSchema, body);
    const userId = getUserId(req);
    const result = await blogCommentService.updateForOwner(id, userId, input);
    return ok(result);
  },

  async deleteForOwner(req: NextRequest, id: string): Promise<NextResponse> {
    const userId = getUserId(req);
    await blogCommentService.deleteForOwner(id, userId);
    return new NextResponse(null, { status: 204 });
  },

  async updateAsAdmin(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateBlogCommentSchema, body);
    const result = await blogCommentService.updateAsAdmin(id, input);
    return ok(result);
  },

  async deleteAsAdmin(_req: NextRequest, id: string): Promise<NextResponse> {
    await blogCommentService.deleteAsAdmin(id);
    return new NextResponse(null, { status: 204 });
  },
};
