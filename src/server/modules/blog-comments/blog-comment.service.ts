import {
  ForbiddenException,
  NotFoundException,
} from "@/server/exceptions/exceptions";
import type {
  CreateBlogCommentDTO,
  UpdateBlogCommentDTO,
} from "@/server/modules/blog-comments/blog-comment.dto";
import {
  blogCommentRepository,
  type BlogCommentWithAuthor,
} from "@/server/modules/blog-comments/blog-comment.repository";
import { blogRepository } from "@/server/modules/blogs/blog.repository";
import type { PaginationMeta } from "@/shared/types/pagination.types";
import type { BlogCommentDTO } from "@/shared/types/blog-comment.types";

function toDTO(row: BlogCommentWithAuthor): BlogCommentDTO {
  return {
    id: row.id,
    blogId: row.blogId,
    userId: row.userId,
    authorName: row.authorName,
    authorImage: row.authorImage,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export const blogCommentService = {
  async listByPublishedBlogSlug(
    slug: string,
    page: number,
    limit: number,
  ): Promise<{ items: BlogCommentDTO[]; meta: PaginationMeta }> {
    const blog = await blogRepository.findPublishedBySlug(slug);

    if (!blog) {
      throw new NotFoundException("Blog", slug);
    }

    const { items, total } = await blogCommentRepository.findManyByBlogId(
      blog.id,
      page,
      limit,
    );

    return {
      items: items.map(toDTO),
      meta: toMeta(page, limit, total),
    };
  },

  async createOnPublishedBlog(
    slug: string,
    userId: string,
    input: CreateBlogCommentDTO,
  ): Promise<BlogCommentDTO> {
    const blog = await blogRepository.findPublishedBySlug(slug);

    if (!blog) {
      throw new NotFoundException("Blog", slug);
    }

    const created = await blogCommentRepository.create(blog.id, userId, input);
    const withAuthor = await blogCommentRepository.findByIdWithAuthor(
      created.id,
    );

    if (!withAuthor) {
      throw new NotFoundException("BlogComment", created.id);
    }

    return toDTO(withAuthor);
  },

  async updateForOwner(
    commentId: string,
    userId: string,
    input: UpdateBlogCommentDTO,
  ): Promise<BlogCommentDTO> {
    const found = await blogCommentRepository.findById(commentId);

    if (!found) {
      throw new NotFoundException("BlogComment", commentId);
    }

    if (found.userId !== userId) {
      throw new ForbiddenException();
    }

    const updated = await blogCommentRepository.update(commentId, input.body);

    if (!updated) {
      throw new NotFoundException("BlogComment", commentId);
    }

    const withAuthor =
      await blogCommentRepository.findByIdWithAuthor(commentId);

    if (!withAuthor) {
      throw new NotFoundException("BlogComment", commentId);
    }

    return toDTO(withAuthor);
  },

  async deleteForOwner(commentId: string, userId: string): Promise<void> {
    const found = await blogCommentRepository.findById(commentId);

    if (!found) {
      throw new NotFoundException("BlogComment", commentId);
    }

    if (found.userId !== userId) {
      throw new ForbiddenException();
    }

    const deleted = await blogCommentRepository.delete(commentId);

    if (!deleted) {
      throw new NotFoundException("BlogComment", commentId);
    }
  },

  /** Staff (admin or content manager): update any comment by id (blog may be draft/archived). */
  async updateAsAdmin(
    commentId: string,
    input: UpdateBlogCommentDTO,
  ): Promise<BlogCommentDTO> {
    const updated = await blogCommentRepository.update(commentId, input.body);

    if (!updated) {
      throw new NotFoundException("BlogComment", commentId);
    }

    const withAuthor =
      await blogCommentRepository.findByIdWithAuthor(commentId);

    if (!withAuthor) {
      throw new NotFoundException("BlogComment", commentId);
    }

    return toDTO(withAuthor);
  },

  /** Staff (admin or content manager): delete any comment by id. */
  async deleteAsAdmin(commentId: string): Promise<void> {
    const deleted = await blogCommentRepository.delete(commentId);

    if (!deleted) {
      throw new NotFoundException("BlogComment", commentId);
    }
  },
};
