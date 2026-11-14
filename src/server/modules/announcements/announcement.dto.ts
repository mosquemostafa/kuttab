import { z } from "zod";
import { UserRole } from "@/shared/enums/user-role.enum";
import { AnnouncementType } from "@/shared/enums/announcement-type.enum";

const targetTypeSchema = z.enum(["all", "role", "segment"]);

const nullableTargetValue = z.preprocess((value) => {
  if (value === "") {
    return null;
  }
  return value;
}, z.string().min(1).max(120).nullable().optional());

export const createAnnouncementSchema = z
  .object({
    titleAr: z.string().min(1).max(200),
    titleEn: z.string().min(1).max(200),
    contentAr: z.string().min(1).max(10000),
    contentEn: z.string().min(1).max(10000),
    type: z.nativeEnum(AnnouncementType),
    targetType: targetTypeSchema,
    targetValue: nullableTargetValue,
    publish: z.boolean().optional().default(false),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.targetType === "all") {
      if (value.targetValue !== null && value.targetValue !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetValue"],
          message: "targetValue must be null when targetType is 'all'",
        });
      }
      return;
    }

    if (!value.targetValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message: "targetValue is required when targetType is not 'all'",
      });
      return;
    }

    if (
      value.targetType === "role" &&
      !Object.values(UserRole).includes(value.targetValue as UserRole)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message:
          "targetValue must be a valid user role when targetType is 'role'",
      });
    }
  });

export const updateAnnouncementSchema = z
  .object({
    titleAr: z.string().min(1).max(200),
    titleEn: z.string().min(1).max(200),
    contentAr: z.string().min(1).max(10000),
    contentEn: z.string().min(1).max(10000),
    targetType: targetTypeSchema.optional(),
    targetValue: nullableTargetValue,
    publishedAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.targetType === undefined) {
      if (value.targetValue !== null && value.targetValue !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetType"],
          message: "targetType is required when targetValue is provided",
        });
      }
      // Intentionally valid for partial updates that don't touch targeting.
      return;
    }

    if (value.targetType === "all") {
      if (value.targetValue !== null && value.targetValue !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetValue"],
          message: "targetValue must be null when targetType is 'all'",
        });
      }
      return;
    }

    if (!value.targetValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message: "targetValue is required when targetType is not 'all'",
      });
      return;
    }

    if (
      value.targetType === "role" &&
      !Object.values(UserRole).includes(value.targetValue as UserRole)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetValue"],
        message:
          "targetValue must be a valid user role when targetType is 'role'",
      });
    }
  });

export const markAnnouncementsSeenSchema = z.object({
  announcementIds: z.array(z.string().min(1)).min(1),
});

export type CreateAnnouncementDTO = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementDTO = z.infer<typeof updateAnnouncementSchema>;
export type MarkAnnouncementsSeenDTO = z.infer<
  typeof markAnnouncementsSeenSchema
>;
