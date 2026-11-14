import { z } from "zod";

export const seedRequestSchema = z.object({
  targetUserId: z
    .string()
    .min(1, "targetUserId must not be empty if provided")
    .optional(),
  cleanBeforeSeed: z.boolean().optional().default(true),
});

export type SeedRequestDTO = z.infer<typeof seedRequestSchema>;
export type SeedInputDTO = z.input<typeof seedRequestSchema>;

export interface SeedResultDTO {
  success: boolean;
  targetUserId: string;
  summary: Record<string, number>;
  message: string;
}
