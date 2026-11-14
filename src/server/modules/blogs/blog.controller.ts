import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  createBlogSchema,
  listAdminBlogsQuerySchema,
  listBlogsQuerySchema,
  updateBlogSchema,
} from "@/server/modules/blogs/blog.dto";
import { blogService } from "@/server/modules/blogs/blog.service";
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

export const blogController = {
  async listPublished(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const pagination = parsePagination(searchParams);

    const query = listBlogsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await blogService.listPublished(
      query,
      pagination.page,
      pagination.limit,
    );

    return ok(result.items, result.meta);
  },

  async listFeaturedPublished(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const pagination = parsePagination(searchParams);

    const query = listBlogsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await blogService.listFeaturedPublished(
      query,
      pagination.page,
      pagination.limit,
    );

    return ok(result.items, result.meta);
  },

  async listPublishedSlugs(): Promise<NextResponse> {
    const result = await blogService.listPublishedSlugs();
    return ok(result);
  },

  async listPublishedTopTags(): Promise<NextResponse> {
    const tags = await blogService.listPublishedTopTags();
    return ok(tags);
  },

  async getPublishedBySlug(slug: string): Promise<NextResponse> {
    const result = await blogService.getPublishedBySlug(slug);
    return ok(result);
  },

  async listPublishedRelatedByBlogId(id: string): Promise<NextResponse> {
    const result = await blogService.listPublishedRelatedByBlogId(id);
    return ok(result);
  },

  async listAdmin(req: NextRequest): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const pagination = parsePagination(searchParams);

    const query = listAdminBlogsQuerySchema.parse({
      q: searchParams.get("q") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      authorId: searchParams.get("authorId") ?? undefined,
      slug: searchParams.get("slug") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const result = await blogService.listAdmin(
      query,
      pagination.page,
      pagination.limit,
    );

    return ok(result.items, result.meta);
  },

  async getById(id: string): Promise<NextResponse> {
    const result = await blogService.getById(id);
    return ok(result);
  },

  async create(req: NextRequest): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(createBlogSchema, body);
    const authorId = getUserId(req);
    const result = await blogService.create(authorId, input);
    return ok(result, undefined, 201);
  },

  async update(req: NextRequest, id: string): Promise<NextResponse> {
    const body = await req.json();
    const input = validateBody(updateBlogSchema, body);
    const result = await blogService.update(id, input);
    return ok(result);
  },

  async delete(id: string): Promise<NextResponse> {
    await blogService.delete(id);
    return new NextResponse(null, { status: 204 });
  },
};
