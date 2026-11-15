import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phone: z.string().trim().max(50).nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const setPasswordSchema = z.object({
  newPassword: z.string().min(8),
});
