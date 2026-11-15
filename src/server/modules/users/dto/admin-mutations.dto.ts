import { z } from "zod";
import { UserRole } from "@/shared/enums/user-role.enum";

export const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z
    .string()
    .trim()
    .regex(
      EGYPTIAN_PHONE_REGEX,
      "Phone number must be an 11-digit Egyptian number (e.g. 01012345678)",
    ),
  role: z.nativeEnum(UserRole).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  autoVerify: z.boolean().optional(),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

export const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export const updateUserSegmentSchema = z.object({
  segmentId: z.string().nullable(),
});

export const banUserSchema = z.object({
  banReason: z.string().default("Spamming"),
  banExpiresIn: z.number().int().positive().optional(),
});
