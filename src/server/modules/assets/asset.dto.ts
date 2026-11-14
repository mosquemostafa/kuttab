import { z } from "zod";

import {
  ALLOWED_FILE_MIME_TYPES,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES_FILES,
  MAX_FILE_SIZE_BYTES,
  PREDEFINED_FILE_FOLDERS,
  PREDEFINED_FOLDERS,
} from "@/server/modules/assets/asset.constants";
import { mediaFile } from "@/server/modules/assets/asset.entity";

const MAX_QUERY_LIMIT = 100;
const DEFAULT_LIST_PAGE = 1;
const DEFAULT_LIST_LIMIT = 20;

const RESOURCE_TYPE_VALUES = ["image", "video", "raw"] as const;
const RESOURCE_TYPE_SCHEMA = z.enum(RESOURCE_TYPE_VALUES);
const ASSET_TYPE_VALUES = ["image", "file"] as const;
const ASSET_TYPE_SCHEMA = z.enum(ASSET_TYPE_VALUES);

const allowedMimeTypes = [...ALLOWED_MIME_TYPES] as [string, ...string[]];
const allowedFileMimeTypes = [...ALLOWED_FILE_MIME_TYPES] as [
  string,
  ...string[],
];
const allowedImageFolders = new Set(PREDEFINED_FOLDERS);
const allowedFileFolders = new Set(PREDEFINED_FILE_FOLDERS);

const nullableOptionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

const tagsSchema = z.array(z.string().trim().min(1).max(64)).max(50).optional();

export const uploadSignatureRequestSchema = z
  .object({
    assetType: ASSET_TYPE_SCHEMA,
    fileName: z.string().trim().min(1).max(255),
    fileSize: z.coerce.number().int().positive(),
    mimeType: z.string().trim().min(1),
    folder: z.string().trim().min(1).max(120),
    tags: tagsSchema,
  })
  .superRefine((value, ctx) => {
    if (value.assetType === "image") {
      if (
        !allowedImageFolders.has(
          value.folder as (typeof PREDEFINED_FOLDERS)[number],
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unsupported image folder",
          path: ["folder"],
        });
      }

      if (!z.enum(allowedMimeTypes).safeParse(value.mimeType).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unsupported image mime type",
          path: ["mimeType"],
        });
      }

      if (value.fileSize > MAX_FILE_SIZE_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: MAX_FILE_SIZE_BYTES,
          inclusive: true,
          origin: "number",
          type: "number",
          message: `Image exceeds max size of ${MAX_FILE_SIZE_BYTES} bytes`,
          path: ["fileSize"],
        });
      }

      return;
    }

    if (
      !allowedFileFolders.has(
        value.folder as (typeof PREDEFINED_FILE_FOLDERS)[number],
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported file folder",
        path: ["folder"],
      });
    }

    if (!z.enum(allowedFileMimeTypes).safeParse(value.mimeType).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported file mime type",
        path: ["mimeType"],
      });
    }

    if (value.fileSize > MAX_FILE_SIZE_BYTES_FILES) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: MAX_FILE_SIZE_BYTES_FILES,
        inclusive: true,
        origin: "number",
        type: "number",
        message: `File exceeds max size of ${MAX_FILE_SIZE_BYTES_FILES} bytes`,
        path: ["fileSize"],
      });
    }
  });

export const uploadCompleteRequestSchema = z.object({
  publicId: z.string().trim().min(1).max(255),
  resourceType: RESOURCE_TYPE_SCHEMA,
  format: nullableOptionalString,
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
  bytes: z.coerce.number().int().nonnegative(),
  originalFilename: nullableOptionalString,
  folder: z.string().trim().min(1).max(120),
  tags: tagsSchema,
});

export const replaceSignatureRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.coerce.number().int().positive(),
  mimeType: z.string().trim().min(1),
});

export const replaceCompleteRequestSchema = z.object({
  publicId: z.string().trim().min(1).max(255),
});

export const assetsListQuerySchema = z.object({
  q: nullableOptionalString,
  folder: nullableOptionalString,
  resourceType: RESOURCE_TYPE_SCHEMA.optional(),
  format: nullableOptionalString,
  tags: z.array(z.string().trim().min(1).max(32)).max(20).optional(),
  page: z.coerce.number().int().min(1).default(DEFAULT_LIST_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_QUERY_LIMIT)
    .default(DEFAULT_LIST_LIMIT),
});

export const assetIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

export const updateAssetFilenameRequestSchema = z.object({
  filename: z.string().trim().min(1).max(255),
});

export const updateAssetTagsRequestSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(32)).max(20),
});

export const moveAssetRequestSchema = z.object({
  folder: z.string().trim().min(1).max(120),
});

export const assetResponseSchema = z.object({
  id: z.string().min(1),
  publicId: z.string(),
  cloudinaryUrl: z.string(),
  secureUrl: z.string(),
  resourceType: RESOURCE_TYPE_SCHEMA,
  format: z.string().nullable(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  bytes: z.number().int().nonnegative(),
  folder: z.string(),
  filename: z.string(),
  originalFilename: z.string().nullable(),
  tags: z.array(z.string()),
  uploadedBy: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type UploadSignatureRequestDto = z.infer<
  typeof uploadSignatureRequestSchema
>;
export type UploadCompleteRequestDto = z.infer<
  typeof uploadCompleteRequestSchema
>;
export type ReplaceSignatureRequestDto = z.infer<
  typeof replaceSignatureRequestSchema
>;
export type ReplaceCompleteRequestDto = z.infer<
  typeof replaceCompleteRequestSchema
>;
export type AssetsListQueryDto = z.infer<typeof assetsListQuerySchema>;
export type UpdateAssetFilenameRequestDto = z.infer<
  typeof updateAssetFilenameRequestSchema
>;
export type UpdateAssetTagsRequestDto = z.infer<
  typeof updateAssetTagsRequestSchema
>;
export type MoveAssetRequestDto = z.infer<typeof moveAssetRequestSchema>;
export type AssetResponseDto = z.infer<typeof assetResponseSchema>;

type MediaFileRow = typeof mediaFile.$inferSelect;

export function toAssetResponseDto(row: MediaFileRow): AssetResponseDto {
  return assetResponseSchema.parse({
    id: row.id,
    publicId: row.publicId,
    cloudinaryUrl: row.cloudinaryUrl,
    secureUrl: row.secureUrl,
    resourceType: row.resourceType,
    format: row.format ?? null,
    width: row.width ?? null,
    height: row.height ?? null,
    bytes: row.bytes,
    folder: row.folder,
    filename: row.filename,
    originalFilename: row.originalFilename ?? null,
    tags: row.tags,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}
