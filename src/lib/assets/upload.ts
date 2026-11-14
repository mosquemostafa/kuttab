import type {
  ApiResponse,
  ApiSuccess,
} from "@/shared/types/api-response.types";
import type {
  AssetResponseDto,
  ReplaceSignatureRequestDto,
  UploadCompleteRequestDto,
  UploadSignatureRequestDto,
} from "@/server/modules/assets/asset.dto";

const ASSETS_API_BASE = "/api/content/assets";

type UploadSignatureResponse = {
  upload: {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    publicId: string;
    folder: string;
    resourceType: "image" | "raw";
    allowedFormats?: string[];
    tags?: string;
  };
  targetFolder: string;
};

type CloudinaryUploadResponse = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id?: string;
  signature: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag?: string;
  placeholder?: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename?: string;
  [key: string]: unknown;
};

type ReplaceSignatureResponse = {
  upload: {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    publicId: string;
    resourceType: "image" | "raw";
    overwrite: true;
    invalidate: true;
    type: "upload";
    allowedFormats?: string[];
  };
};

type SignedCloudinaryUploadParams = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  publicId: string;
  resourceType: "image" | "raw";
  folder?: string;
  allowedFormats?: string[];
  tags?: string;
  overwrite?: boolean;
  invalidate?: boolean;
  type?: "upload";
};

type FinalizeUploadPayload = Omit<UploadCompleteRequestDto, "publicId">;

async function requestJson<T>(
  path: string,
  method: "POST",
  body: unknown,
): Promise<T> {
  const response = await fetch(`${ASSETS_API_BASE}${path}`, {
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

export async function fetchUploadSignature(
  params: UploadSignatureRequestDto,
): Promise<UploadSignatureResponse> {
  return requestJson<UploadSignatureResponse>(
    "/upload/signature",
    "POST",
    params,
  );
}

export async function finalizeUpload(
  publicId: string,
  payload: FinalizeUploadPayload,
): Promise<AssetResponseDto> {
  return requestJson<AssetResponseDto>("/upload/complete", "POST", {
    publicId,
    ...payload,
  });
}

export async function fetchReplaceSignature(
  assetId: string,
  params: ReplaceSignatureRequestDto,
): Promise<ReplaceSignatureResponse> {
  return requestJson<ReplaceSignatureResponse>(
    `/${assetId}/replace/signature`,
    "POST",
    params,
  );
}

export async function finalizeReplace(
  assetId: string,
  publicId: string,
): Promise<AssetResponseDto> {
  return requestJson<AssetResponseDto>(`/${assetId}/replace/complete`, "POST", {
    publicId,
  });
}

export function uploadToCloudinary(
  file: File,
  signedParams: SignedCloudinaryUploadParams,
  onProgress: (progress: number) => void,
  options?: { signal?: AbortSignal },
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${signedParams.cloudName}/${signedParams.resourceType}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", signedParams.signature);
    formData.append("timestamp", String(signedParams.timestamp));
    formData.append("api_key", signedParams.apiKey);
    formData.append("public_id", signedParams.publicId);

    if (signedParams.folder) {
      formData.append("folder", signedParams.folder);
    }

    if (typeof signedParams.overwrite === "boolean") {
      formData.append("overwrite", String(signedParams.overwrite));
    }

    if (typeof signedParams.invalidate === "boolean") {
      formData.append("invalidate", String(signedParams.invalidate));
    }

    if (signedParams.type) {
      formData.append("type", signedParams.type);
    }

    if (signedParams.tags) {
      formData.append("tags", signedParams.tags);
    }

    if (signedParams.allowedFormats && signedParams.allowedFormats.length > 0) {
      formData.append("allowed_formats", signedParams.allowedFormats.join(","));
    }

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (!event.lengthComputable || event.total <= 0) {
        return;
      }

      onProgress(event.loaded / event.total);
    };

    xhr.onerror = () => {
      reject(new Error("Network error while uploading to Cloudinary"));
    };

    xhr.onabort = () => {
      reject(new Error("Upload aborted"));
    };

    xhr.onload = () => {
      const responseText = xhr.responseText;

      if (xhr.status < 200 || xhr.status >= 300) {
        if (!responseText) {
          reject(
            new Error(`Cloudinary upload failed with status ${xhr.status}`),
          );
          return;
        }

        try {
          const parsed = JSON.parse(responseText) as {
            error?: { message?: string };
          };
          reject(
            new Error(
              parsed.error?.message ??
                `Cloudinary upload failed with status ${xhr.status}`,
            ),
          );
        } catch {
          reject(
            new Error(`Cloudinary upload failed with status ${xhr.status}`),
          );
        }
        return;
      }

      try {
        const parsed = JSON.parse(responseText) as CloudinaryUploadResponse;
        resolve(parsed);
      } catch {
        reject(new Error("Invalid JSON response from Cloudinary upload"));
      }
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

    xhr.open("POST", uploadUrl);
    xhr.send(formData);
  });
}
