import type { ZodSchema } from "zod";

import { ValidationException } from "@/server/exceptions/exceptions";

export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationException(result.error.flatten().fieldErrors);
  }
  return result.data;
}
