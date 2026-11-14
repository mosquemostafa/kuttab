import { env } from "@/server/lib/env";
import {
  ALLOWED_FILE_MIME_TYPES as SHARED_ALLOWED_FILE_MIME_TYPES,
  PREDEFINED_FILE_FOLDERS as SHARED_PREDEFINED_FILE_FOLDERS,
  PREDEFINED_FOLDERS as SHARED_PREDEFINED_FOLDERS,
} from "@/shared/constants/assets.constants";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export const ALLOWED_FILE_MIME_TYPES = SHARED_ALLOWED_FILE_MIME_TYPES;

export const MAX_FILE_SIZE_BYTES = env.ASSETS_MAX_IMAGE_UPLOAD_SIZE_BYTES;
export const MAX_FILE_SIZE_BYTES_FILES =
  env.ASSETS_MAX_DOCUMENT_UPLOAD_SIZE_BYTES;

export const DEFAULT_IMAGE_SUBFOLDER = "general";
export const DEFAULT_FILE_SUBFOLDER = "general";

export const PREDEFINED_FILE_FOLDERS = SHARED_PREDEFINED_FILE_FOLDERS;

export const FILE_RESOURCE_TYPE = "raw" as const;

export const PREDEFINED_FOLDERS = SHARED_PREDEFINED_FOLDERS;
