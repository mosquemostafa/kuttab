import { z } from "zod";

export const createBlogCommentSchema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export const updateBlogCommentSchema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export const listBlogCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateBlogCommentDTO = z.infer<typeof createBlogCommentSchema>;
export type UpdateBlogCommentDTO = z.infer<typeof updateBlogCommentSchema>;
