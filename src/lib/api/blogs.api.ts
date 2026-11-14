import type {
  CreateBlogDTO,
  ListAdminBlogsQueryDTO,
  ListBlogsQueryDTO,
  UpdateBlogDTO,
} from "@/server/modules/blogs/blog.dto";
import type { BlogCommentDTO } from "@/shared/types/blog-comment.types";
import type { BlogDTO, BlogListItemDTO } from "@/shared/types/blog.types";
import {
  request,
  requestWithMeta,
  type ApiClientRequestOptions,
} from "@/lib/api/api-core";

export const blogsApi = {
  list: (query?: ListBlogsQueryDTO, options?: ApiClientRequestOptions) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<BlogListItemDTO>(
      `/blogs${params.size ? `?${params.toString()}` : ""}`,
      undefined,
      options,
    );
  },
  listFeatured: (
    query?: ListBlogsQueryDTO,
    options?: ApiClientRequestOptions,
  ) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<BlogListItemDTO>(
      `/blogs/featured${params.size ? `?${params.toString()}` : ""}`,
      undefined,
      options,
    );
  },
  getBySlug: (slug: string, options?: ApiClientRequestOptions) =>
    request<BlogDTO>(`/blogs/${slug}`, undefined, options),
  listRelatedByBlogId: (blogId: string, options?: ApiClientRequestOptions) =>
    request<BlogListItemDTO[]>(
      `/blogs/related/${encodeURIComponent(blogId)}`,
      undefined,
      options,
    ),
  listSlugs: (options?: ApiClientRequestOptions) =>
    request<Array<{ slug: string; updatedAt: string }>>(
      "/blogs/slugs",
      undefined,
      options,
    ),
  topTags: (options?: ApiClientRequestOptions) =>
    request<string[]>("/blogs/top-tags", undefined, options),
};

export const blogCommentsApi = {
  listBySlug: (
    slug: string,
    query?: { page?: number; limit?: number },
    options?: ApiClientRequestOptions,
  ) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<BlogCommentDTO>(
      `/blogs/${encodeURIComponent(slug)}/comments${params.size ? `?${params.toString()}` : ""}`,
      undefined,
      options,
    );
  },
  create: (slug: string, data: { body: string }) =>
    request<BlogCommentDTO>(`/blogs/${encodeURIComponent(slug)}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateOwn: (id: string, data: { body: string }) =>
    request<BlogCommentDTO>(`/blog-comments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteOwn: (id: string) =>
    request<null>(`/blog-comments/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  updateAsStaff: (id: string, data: { body: string }) =>
    request<BlogCommentDTO>(`/admin/blog-comments/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAsStaff: (id: string) =>
    request<null>(`/admin/blog-comments/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};

export const adminBlogsApi = {
  list: (query?: ListAdminBlogsQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<BlogListItemDTO>(
      `/content/blogs${params.size ? `?${params.toString()}` : ""}`,
    );
  },
  getById: (id: string) => request<BlogDTO>(`/content/blogs/${id}`),
  getBySlug: async (slug: string) => {
    const result = await requestWithMeta<BlogListItemDTO>(
      `/content/blogs?slug=${encodeURIComponent(slug)}&page=1&limit=1`,
    );

    const matched = result.items[0] ?? null;

    if (!matched) {
      throw new Error("Blog not found");
    }

    return request<BlogDTO>(`/content/blogs/${matched.id}`);
  },
  create: (data: CreateBlogDTO) =>
    request<BlogDTO>("/content/blogs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: UpdateBlogDTO) =>
    request<BlogDTO>(`/content/blogs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<null>(`/content/blogs/${id}`, {
      method: "DELETE",
    }),
};
