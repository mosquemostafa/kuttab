/**
 * Thrown when a dashboard `fetch` receives JSON with `success: false`.
 * Lets callers branch on `code` (e.g. plan limits) without parsing messages.
 */
export class ApiJsonRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiJsonRequestError";
  }
}
