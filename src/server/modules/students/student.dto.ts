import { z } from "zod";

export const createStudentSchema = z.object({
  userId: z.string().trim().min(1).max(255).optional().nullable(),
  name: z.string().trim().min(1, "Name is required").max(255),
  birthDate: z.iso.date().optional().nullable(),
  grade: z.string().trim().max(100).optional().nullable(),
  job: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  studiedTajweed: z.boolean().default(false),
  previouslyEnrolled: z.boolean().default(false),
  previousEnrolledPlace: z.string().trim().max(255).optional().nullable(),
  memorizedPartsCount: z.coerce
    .number()
    .int()
    .min(0, "Memorized parts count must be at least 0")
    .max(30, "Memorized parts count cannot exceed 30")
    .default(0),
  memorizationDetails: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(["active", "archived", "rejected"]).default("active"),
  registrationDate: z.iso.date().optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
});

export const updateStudentSchema = createStudentSchema.partial();

export const listStudentsQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  userId: z.string().trim().max(255).optional(),
  status: z.enum(["active", "archived", "rejected"]).optional(),
  studiedTajweed: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  previouslyEnrolled: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  minMemorizedParts: z.coerce.number().int().min(0).max(30).optional(),
  maxMemorizedParts: z.coerce.number().int().min(0).max(30).optional(),
  sortBy: z
    .enum(["createdAt", "name", "registrationDate", "memorizedPartsCount"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateStudentDTO = z.infer<typeof createStudentSchema>;
export type UpdateStudentDTO = z.infer<typeof updateStudentSchema>;
export type ListStudentsQueryDTO = z.infer<typeof listStudentsQuerySchema>;
