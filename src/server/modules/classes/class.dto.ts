import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  primaryTeacherId: z.string().trim().min(1).max(255).optional().nullable(),
  secondaryTeacherId: z.string().trim().min(1).max(255).optional().nullable(),
  classType: z.enum(["group", "individual"]).default("group"),
});

export const updateClassSchema = createClassSchema.partial();

export const listClassesQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  primaryTeacherId: z.string().trim().max(255).optional(),
  secondaryTeacherId: z.string().trim().max(255).optional(),
  teacherId: z.string().trim().max(255).optional(),
  classType: z.enum(["group", "individual"]).optional(),
  sortBy: z.enum(["createdAt", "name", "classType"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateClassDTO = z.infer<typeof createClassSchema>;
export type UpdateClassDTO = z.infer<typeof updateClassSchema>;
export type ListClassesQueryDTO = z.infer<typeof listClassesQuerySchema>;
