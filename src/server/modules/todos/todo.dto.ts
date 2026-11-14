import { z } from "zod";

const checklistItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(255),
  isCompleted: z.boolean(),
});
const checklistSchema = z.array(checklistItemSchema).max(20);

export const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(255),
  projectId: z.string().trim().min(1).max(255).optional().nullable(),
  checklist: checklistSchema.optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.iso.date().optional().nullable(),
});

export const updateTodoSchema = createTodoSchema
  .extend({
    isCompleted: z.boolean().optional(),
    priority: z.enum(["low", "medium", "high"]).optional().nullable(),
  })
  .partial();

export const listTodosQuerySchema = z.object({
  q: z.string().trim().max(255).optional(),
  projectId: z.string().trim().max(255).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  sortBy: z.enum(["date", "title", "priority"]).optional(),
  dueFrom: z.iso.date().optional(),
  dueTo: z.iso.date().optional(),
  completed: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  onlyNoDueDate: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  onlyOverdue: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  currentDate: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateTodoDTO = z.infer<typeof createTodoSchema>;
export type UpdateTodoDTO = z.infer<typeof updateTodoSchema>;
export type ListTodosQueryDTO = z.infer<typeof listTodosQuerySchema>;
