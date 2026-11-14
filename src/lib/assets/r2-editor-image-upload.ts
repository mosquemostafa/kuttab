import type {
  ApiResponse,
  ApiSuccess,
} from "@/shared/types/api-response.types";

import { ApiJsonRequestError } from "@/lib/api/api-json-request-error";
import {
  USER_MEDIA_ALLOWED_IMAGE_TYPES,
  USER_MEDIA_MAX_IMAGE_BYTES,
} from "@/shared/constants/user-media.constants";

const BASE = "/api/dashboard/user-media/editor-image";

const allowedTypeSet = new Set<string>(USER_MEDIA_ALLOWED_IMAGE_TYPES);

type EditorImagePresignResponse = {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
};

type EditorImageCompleteResponse = {
  url: string;
  mediaId: string;
};

async function requestJson<T>(
  path: string,
  method: "POST",
  body: unknown,
): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new ApiJsonRequestError(
      json.error.message,
      response.status,
      json.error.code,
      json.error.details,
    );
  }

  return (json as ApiSuccess<T>).data;
}

function uploadWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (ratio: number) => void,
  options?: { signal?: AbortSignal },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (!event.lengthComputable || event.total <= 0) {
        return;
      }
      onProgress?.(event.loaded / event.total);
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading image"));
    };

    xhr.onabort = () => {
      reject(new Error("Upload aborted"));
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Upload failed with status ${xhr.status}`));
        return;
      }
      resolve();
    };

    const abortHandler = () => {
      xhr.abort();
    };

    if (options?.signal) {
      if (options.signal.aborted) {
        reject(new Error("Upload aborted"));
        return;
      }
      options.signal.addEventListener("abort", abortHandler, { once: true });
    }

    xhr.onloadend = () => {
      if (options?.signal) {
        options.signal.removeEventListener("abort", abortHandler);
      }
    };

    xhr.send(file);
  });
}

/**
 * Validates, presigns, uploads directly to Cloudflare R2, and finalizes the editor image.
 */
export async function uploadEditorImageFromFile(
  file: File,
  onProgress?: (ratio: number) => void,
  options?: { signal?: AbortSignal },
): Promise<EditorImageCompleteResponse> {
  if (!allowedTypeSet.has(file.type)) {
    throw new Error(
      "Unsupported image format. Please upload JPEG, PNG, WebP or AVIF.",
    );
  }

  if (file.size > USER_MEDIA_MAX_IMAGE_BYTES) {
    throw new Error("Image file is too large. Maximum size is 5MB.");
  }

  const presign = await requestJson<EditorImagePresignResponse>(
    "/presign",
    "POST",
    {
      contentType: file.type,
      fileSize: file.size,
    },
  );

  await uploadWithProgress(
    presign.uploadUrl,
    file,
    presign.headers,
    onProgress,
    options,
  );

  return requestJson<EditorImageCompleteResponse>("/complete", "POST", {
    objectKey: presign.objectKey,
  });
}
