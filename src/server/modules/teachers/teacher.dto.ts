import { z } from "zod";

export const createTeacherSchema = z.object({
  userId: z.string().trim().min(1).max(255).optional().nullable(),
  name: z.string().trim().min(1, "Name is required").max(255),
  phone: z.string().trim().max(50).optional().nullable(),
  studentType: z
    .enum(["foundation", "khatimeen", "children", "adults"])
    .optional()
    .nullable(),
  status: z.enum(["active", "archived"]).default("active"),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const updateTeacherSchema = createTeacherSchema.partial();

export const listTeachersQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  userId: z.string().trim().max(255).optional(),
  studentType: z
    .enum(["foundation", "khatimeen", "children", "adults"])
    .optional(),
  status: z.enum(["active", "archived"]).optional(),
  sortBy: z.enum(["createdAt", "name", "status"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateTeacherDTO = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherDTO = z.infer<typeof updateTeacherSchema>;
export type ListTeachersQueryDTO = z.infer<typeof listTeachersQuerySchema>;
