import { ErrorCodes, type ErrorCode } from "@/server/constants/error-codes";
import { HttpException } from "@/server/exceptions/http.exception";

export class UnauthorizedException extends HttpException {
  constructor(message = "You must be signed in to access this resource") {
    super(401, ErrorCodes.UNAUTHORIZED, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "You do not have permission to perform this action") {
    super(403, ErrorCodes.FORBIDDEN, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(resource: string, identifier?: string) {
    super(
      404,
      ErrorCodes.NOT_FOUND,
      identifier
        ? `${resource} with identifier '${identifier}' was not found`
        : `${resource} was not found`,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(details: unknown) {
    super(422, ErrorCodes.VALIDATION_ERROR, "Validation failed", details);
  }
}

export class ConflictException extends HttpException {
  constructor(message: string, code: ErrorCode = ErrorCodes.CONFLICT) {
    super(409, code, message);
  }
}

export class NewsletterDisabledException extends HttpException {
  constructor(
    message = "Newsletter is not configured. Set Resend and QStash environment variables.",
  ) {
    super(503, ErrorCodes.NEWSLETTER_DISABLED, message);
  }
}

export class RateLimitException extends HttpException {
  constructor(message = "Too many requests. Please try again later.") {
    super(429, ErrorCodes.TOO_MANY_REQUESTS, message);
  }
}
