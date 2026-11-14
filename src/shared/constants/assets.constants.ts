export const PREDEFINED_FOLDERS = [
  "general",
  "marketing",
  "products",
  "blog",
] as const;

export const PREDEFINED_FILE_FOLDERS = [
  "general",
  "documents",
  "reports",
  "contracts",
] as const;

export const ALLOWED_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
] as const;

export const MAX_FILE_SIZE_BYTES_FILES = 50 * 1024 * 1024;

export const IMAGE_FORMAT_FILTERS = [
  "jpg",
  "png",
  "webp",
  "gif",
  "svg",
] as const;

export const FILE_FORMAT_FILTERS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
] as const;
