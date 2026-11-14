import { z } from "zod";

import { COLOR_KEYS } from "@/shared/constants/color-palette";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  colorKey: z.enum(COLOR_KEYS).optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  isArchived: z.boolean().optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const listProjectsQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  isArchived: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const projectCountsQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  isArchived: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const projectAnalyticsQuerySchema = z.object({
  projectId: z.string().trim().min(1).max(255).optional(),
});

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
export type CreateProjectBody = z.input<typeof createProjectSchema>;
export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;
export type ListProjectsQueryDTO = z.infer<typeof listProjectsQuerySchema>;
export type ProjectCountsQueryDTO = z.infer<typeof projectCountsQuerySchema>;
export type ProjectAnalyticsQueryDTO = z.infer<
  typeof projectAnalyticsQuerySchema
>;
