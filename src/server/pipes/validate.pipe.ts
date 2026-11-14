import type { ZodSchema } from "zod";

import { ValidationException } from "@/server/exceptions/exceptions";

export function validateBody<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationException(result.error.flatten().fieldErrors);
  }
  return result.data;
}

export function validateQuery<T>(
  schema: ZodSchema<T>,
  params: URLSearchParams | Record<string, unknown>,
): T {
  const obj =
    params instanceof URLSearchParams
      ? Object.fromEntries(params.entries())
      : params;
  const result = schema.safeParse(obj);
  if (!result.success) {
    throw new ValidationException(result.error.flatten().fieldErrors);
  }
  return result.data;
}
