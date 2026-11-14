import type {
  ApiResponse,
  ApiSuccess,
} from "@/shared/types/api-response.types";

const AVATAR_API_BASE = "/api/dashboard/avatar/upload";

type AvatarPresignResponse = {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
};

type AvatarCompleteResponse = {
  imageUrl: string;
};

async function requestJson<T>(
  path: string,
  method: "POST",
  body: unknown,
): Promise<T> {
  const response = await fetch(`${AVATAR_API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new Error(json.error.message);
  }

  return (json as ApiSuccess<T>).data;
}

function uploadWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (ratio: number) => void,
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
      onProgress(event.loaded / event.total);
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading file"));
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
 * Presign → PUT to R2 → complete on app server (updates `users.image`).
 */
export async function uploadUserAvatarFromFile(
  file: File,
  onProgress: (ratio: number) => void,
  options?: { signal?: AbortSignal },
): Promise<AvatarCompleteResponse> {
  const presign = await requestJson<AvatarPresignResponse>("/presign", "POST", {
    contentType: file.type,
    fileSize: file.size,
  });

  await uploadWithProgress(
    presign.uploadUrl,
    file,
    presign.headers,
    onProgress,
    options,
  );

  return requestJson<AvatarCompleteResponse>("/complete", "POST", {
    objectKey: presign.objectKey,
  });
}
