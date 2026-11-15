import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter",
  })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter",
  });

export const passwordWithConfirmationSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordWithConfirmationSchema = z.infer<
  typeof passwordWithConfirmationSchema
>;

export const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;

export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: passwordSchema,
  name: z.string().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(EGYPTIAN_PHONE_REGEX, {
      message:
        "Phone number must be an 11-digit Egyptian number (e.g. 01012345678)",
    }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

export const setPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: "Please confirm password" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetPasswordSchema = z.infer<typeof setPasswordSchema>;

export const personalInformationSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  phone: z
    .string()
    .trim()
    .regex(EGYPTIAN_PHONE_REGEX, {
      message:
        "Phone number must be an 11-digit Egyptian number (e.g. 01012345678)",
    }),
});

export type PersonalInformationSchema = z.infer<
  typeof personalInformationSchema
>;
