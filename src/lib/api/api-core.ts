import { failedApiResponseToError } from "@/lib/api/api-error";
import type {
  ApiError,
  ApiResponse,
  ApiSuccess,
} from "@/shared/types/api-response.types";
import type { PaginatedResponse } from "@/shared/types/pagination.types";

export type ApiClientRequestOptions = {
  baseUrl?: string;
};

export async function apiFetch(
  path: string,
  init?: RequestInit,
  cache?: RequestCache,
  options?: ApiClientRequestOptions,
): Promise<Response> {
  const normalizedPath = path.startsWith("/api") ? path : `/api${path}`;
  const url = options?.baseUrl
    ? `${options.baseUrl.replace(/\/$/, "")}${normalizedPath}`
    : normalizedPath;

  const response = await fetch(url, {
    ...(cache !== undefined ? { cache } : {}),
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  return response;
}

async function parseApiResponse<T>(
  response: Response,
): Promise<ApiResponse<T>> {
  return response.json().catch(() => {
    throw new Error(`Request failed (${response.status}).`);
  });
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  options?: ApiClientRequestOptions,
): Promise<T> {
  const response = await apiFetch(path, init, undefined, options);

  if (response.status === 204) {
    return null as T;
  }

  const json = await parseApiResponse<T>(response);

  if (!json.success) {
    throw failedApiResponseToError((json as ApiError).error);
  }

  return (json as ApiSuccess<T>).data;
}

export async function requestNoStore<T>(
  path: string,
  init?: RequestInit,
  options?: ApiClientRequestOptions,
): Promise<T> {
  const response = await apiFetch(path, init, "no-store", options);

  if (response.status === 204) {
    return null as T;
  }

  const json = await parseApiResponse<T>(response);

  if (!json.success) {
    throw failedApiResponseToError((json as ApiError).error);
  }

  return (json as ApiSuccess<T>).data;
}

export async function requestWithMeta<T>(
  path: string,
  init?: RequestInit,
  options?: ApiClientRequestOptions,
): Promise<PaginatedResponse<T>> {
  const response = await apiFetch(path, init, "no-store", options);

  const json = await parseApiResponse<T[]>(response);

  if (!json.success) {
    throw failedApiResponseToError((json as ApiError).error);
  }

  return {
    items: json.data,
    meta: json.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
  };
}
