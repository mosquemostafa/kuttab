import { z } from "zod";

import { FCM_SOURCES } from "@/shared/types/fcm.types";

const fcmTokenSchema = z
  .string()
  .trim()
  .min(1, "Token is required")
  .max(4096, "Token is too long")
  .refine((value) => !value.includes("/"), "Token must not include '/'");

export const registerFcmTokenSchema = z.object({
  token: fcmTokenSchema,
  device: z.string().trim().min(1).max(100).optional().default("web"),
  userAgent: z.string().trim().min(1).max(500).optional(),
  os: z.string().trim().min(1).max(100).optional(),
  source: z.enum(FCM_SOURCES),
});

export const unregisterFcmTokenSchema = z.object({
  token: fcmTokenSchema,
});

export const sendFcmToUserSchema = z.object({
  userId: z.string().trim().min(1, "userId is required"),
  title: z.string().trim().min(1, "title is required").max(200),
  body: z.string().trim().min(1, "body is required").max(2000),
  url: z.string().trim().min(1).max(2000).optional(),
  imageUrl: z
    .string()
    .trim()
    .url("imageUrl must be a valid URL")
    .max(2000)
    .optional(),
  data: z.record(z.string(), z.string()).optional(),
});

export const sendFcmToTokenSchema = z.object({
  token: fcmTokenSchema,
  title: z.string().trim().min(1, "title is required").max(200),
  body: z.string().trim().min(1, "body is required").max(2000),
  url: z.string().trim().min(1).max(2000).optional(),
  imageUrl: z
    .string()
    .trim()
    .url("imageUrl must be a valid URL")
    .max(2000)
    .optional(),
  data: z.record(z.string(), z.string()).optional(),
});

const sendFcmTopicPayloadSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200),
  body: z.string().trim().min(1, "body is required").max(2000),
  url: z.string().trim().min(1).max(2000).optional(),
  imageUrl: z
    .string()
    .trim()
    .url("imageUrl must be a valid URL")
    .max(2000)
    .optional(),
  data: z.record(z.string(), z.string()).optional(),
});

const customTopicSchema = z
  .string()
  .trim()
  .min(1, "topic is required")
  .max(100)
  .regex(
    /^[a-z0-9_]+$/,
    "topic must contain only lowercase letters, numbers, and underscores",
  );

export const sendFcmToRoleTopicSchema = sendFcmTopicPayloadSchema.extend({
  role: z.string().trim().min(1, "role is required"),
});

export const sendFcmToSegmentTopicSchema = sendFcmTopicPayloadSchema.extend({
  segmentId: z.string().trim().min(1, "segmentId is required"),
});

export const sendFcmToAllUsersTopicSchema = sendFcmTopicPayloadSchema;

export const sendFcmToCustomTopicSchema = sendFcmTopicPayloadSchema.extend({
  topic: customTopicSchema,
});

export const updateCustomTopicSubscriptionSchema = z.object({
  topic: customTopicSchema,
  subscribed: z.boolean(),
});

export type RegisterFcmTokenDTO = z.infer<typeof registerFcmTokenSchema>;
export type UnregisterFcmTokenDTO = z.infer<typeof unregisterFcmTokenSchema>;
export type SendFcmToUserDTO = z.infer<typeof sendFcmToUserSchema>;
export type SendFcmToTokenDTO = z.infer<typeof sendFcmToTokenSchema>;
