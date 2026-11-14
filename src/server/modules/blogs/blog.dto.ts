import { z } from "zod";

const blogStatusSchema = z.enum(["draft", "published", "archived"]);

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const tagsSchema = z.array(z.string().trim().min(1).max(50)).max(20);

export const createBlogSchema = z.object({
  titleAr: z.string().trim().min(1).max(200),
  titleEn: z.string().trim().min(1).max(200),
  descriptionAr: z.string().trim().min(1).max(500),
  descriptionEn: z.string().trim().min(1).max(500),
  slug: slugSchema,
  contentAr: z.string().trim().min(1),
  contentEn: z.string().trim().min(1),
  coverImageUrl: z.string().url(),
  isFeatured: z.boolean().optional(),
  excerptAr: z.string().trim().min(1).max(500),
  excerptEn: z.string().trim().min(1).max(500),
  readingMinutes: z.number().int().min(1).max(1440),
  tags: tagsSchema.optional(),
  status: blogStatusSchema.optional(),
  publishDate: z.string().datetime().nullable().optional(),
});

export const updateBlogSchema = createBlogSchema.partial();

/**
 * Normalizes tag query (trim, lowercase). Public blog lists use exact tag match;
 * admin list uses case-insensitive partial match on tags.
 */
const listTagQuerySchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") {
    return undefined;
  }
  if (typeof val !== "string") {
    return undefined;
  }
  const trimmed = val.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(50).optional());

export const listBlogsQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  tag: listTagQuerySchema,
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listAdminBlogsQuerySchema = listBlogsQuerySchema.extend({
  status: blogStatusSchema.optional(),
  authorId: z.string().trim().min(1).optional(),
  slug: slugSchema.optional(),
});

export type CreateBlogDTO = z.infer<typeof createBlogSchema>;
export type UpdateBlogDTO = z.infer<typeof updateBlogSchema>;
export type ListBlogsQueryDTO = z.infer<typeof listBlogsQuerySchema>;
export type ListAdminBlogsQueryDTO = z.infer<typeof listAdminBlogsQuerySchema>;
