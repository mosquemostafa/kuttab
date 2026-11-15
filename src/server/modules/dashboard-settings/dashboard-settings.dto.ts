import { z } from "zod";

export const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z
    .string()
    .trim()
    .regex(
      EGYPTIAN_PHONE_REGEX,
      "Phone number must be an 11-digit Egyptian number (e.g. 01012345678)",
    )
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const setPasswordSchema = z.object({
  newPassword: z.string().min(8),
});
