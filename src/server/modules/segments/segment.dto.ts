import { z } from "zod";

export const createSegmentSchema = z.object({
  name: z.string().trim().min(1).max(100),
  icon: z.string().trim().min(1).max(20),
});

export const updateSegmentSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    icon: z.string().trim().min(1).max(20).optional(),
  })
  .refine((value) => value.name !== undefined || value.icon !== undefined, {
    message: "At least one field is required",
  });

export const listSegmentsQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateSegmentDTO = z.infer<typeof createSegmentSchema>;
export type UpdateSegmentDTO = z.infer<typeof updateSegmentSchema>;
export type ListSegmentsQueryDTO = z.infer<typeof listSegmentsQuerySchema>;
