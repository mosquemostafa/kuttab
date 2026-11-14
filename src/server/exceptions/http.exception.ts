import type { ErrorCode } from "@/server/constants/error-codes";

export class HttpException extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpException";
  }
}
