import { z } from "zod";

import {
  AVATAR_ALLOWED_CONTENT_TYPES,
  AVATAR_MAX_UPLOAD_BYTES,
} from "@/shared/constants/avatar-r2.constants";

const contentTypeSchema = z.enum(AVATAR_ALLOWED_CONTENT_TYPES);

export const avatarPresignRequestSchema = z.object({
  contentType: contentTypeSchema,
  fileSize: z.coerce.number().int().positive().max(AVATAR_MAX_UPLOAD_BYTES),
});

export type AvatarPresignRequestDto = z.infer<
  typeof avatarPresignRequestSchema
>;

export const avatarCompleteRequestSchema = z.object({
  objectKey: z.string().min(1).max(512),
});

export type AvatarCompleteRequestDto = z.infer<
  typeof avatarCompleteRequestSchema
>;
