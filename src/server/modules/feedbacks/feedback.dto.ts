import { z } from "zod";

import { FeedbackStatus } from "@/shared/enums/feedback-status.enum";
import { FeedbackType } from "@/shared/enums/feedback-type.enum";

export const createFeedbackSchema = z.object({
  type: z.nativeEnum(FeedbackType),
  subject: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20000),
});

export const listFeedbacksQuerySchema = z.object({
  status: z.nativeEnum(FeedbackStatus).optional(),
  type: z.nativeEnum(FeedbackType).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateFeedbackStatusSchema = z.object({
  status: z.nativeEnum(FeedbackStatus),
});

export type CreateFeedbackDTO = z.infer<typeof createFeedbackSchema>;
export type ListFeedbacksQueryDTO = z.infer<typeof listFeedbacksQuerySchema>;
export type UpdateFeedbackStatusDTO = z.infer<
  typeof updateFeedbackStatusSchema
>;
