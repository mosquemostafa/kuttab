import { z } from "zod";

import {
  USER_MEDIA_ALLOWED_IMAGE_TYPES,
  USER_MEDIA_MAX_IMAGE_BYTES,
} from "@/shared/constants/user-media.constants";

const contentTypeSchema = z.enum(USER_MEDIA_ALLOWED_IMAGE_TYPES);

export const editorImagePresignRequestSchema = z.object({
  contentType: contentTypeSchema,
  fileSize: z.coerce.number().int().positive().max(USER_MEDIA_MAX_IMAGE_BYTES),
});

export type EditorImagePresignRequestDto = z.infer<
  typeof editorImagePresignRequestSchema
>;

export const editorImageCompleteRequestSchema = z.object({
  objectKey: z.string().min(1).max(512),
});

export type EditorImageCompleteRequestDto = z.infer<
  typeof editorImageCompleteRequestSchema
>;
