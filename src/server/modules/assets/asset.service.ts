import { v2 as cloudinaryV2 } from "cloudinary";

import { ErrorCodes } from "@/server/constants/error-codes";
import { HttpException } from "@/server/exceptions/http.exception";
import { NotFoundException } from "@/server/exceptions/exceptions";
import {
  cloudinary,
  buildFilesFolder,
  buildImageFolder,
} from "@/server/lib/cloudinary";
import {
  ALLOWED_FILE_MIME_TYPES,
  ALLOWED_MIME_TYPES,
  DEFAULT_FILE_SUBFOLDER,
  DEFAULT_IMAGE_SUBFOLDER,
  FILE_RESOURCE_TYPE,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_BYTES_FILES,
  PREDEFINED_FILE_FOLDERS,
  PREDEFINED_FOLDERS,
} from "@/server/modules/assets/asset.constants";
import type {
  AssetResponseDto,
  AssetsListQueryDto,
  ReplaceCompleteRequestDto,
  MoveAssetRequestDto,
  ReplaceSignatureRequestDto,
  UpdateAssetFilenameRequestDto,
  UpdateAssetTagsRequestDto,
  UploadCompleteRequestDto,
  UploadSignatureRequestDto,
} from "@/server/modules/assets/asset.dto";
import { toAssetResponseDto } from "@/server/modules/assets/asset.dto";
import {
  assetRepository,
  type AssetRow,
} from "@/server/modules/assets/asset.repository";

type UploadSignatureResult = {
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

type ReplaceSignatureResult = {
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

type CloudinaryResource = Awaited<ReturnType<typeof cloudinary.api.resource>>;

function normalizeTags(tags?: string[]): string[] {
  if (!tags || tags.length === 0) {
    return [];
  }

  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => tag.length > 0),
    ),
  );
}

function normalizeSubfolder(folder: string, fallback: string): string {
  const trimmed = folder.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function isCloudinaryNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("not found") || message.includes("does not exist");
}

function getFilenameFallback(publicId: string): string {
  const basename = publicId.split("/").pop()?.trim();
  return basename && basename.length > 0 ? basename : publicId;
}

function buildUniquePublicId(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "").trim();
  const normalizedBase = withoutExtension
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  const base = normalizedBase.length > 0 ? normalizedBase : "asset";
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);

  return `${base}-${timestamp}-${random}`;
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const directCode = (error as { code?: unknown }).code;
  if (typeof directCode === "string") {
    return directCode;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (!cause || typeof cause !== "object") {
    return undefined;
  }

  const causeCode = (cause as { code?: unknown }).code;
  return typeof causeCode === "string" ? causeCode : undefined;
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return getErrorCode(error) === "23505";
}

function extractExtension(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const basename = value.split("/").pop()?.trim() ?? "";

  if (!basename) {
    return undefined;
  }

  const lastDotIndex = basename.lastIndexOf(".");

  if (lastDotIndex <= 0 || lastDotIndex === basename.length - 1) {
    return undefined;
  }

  return basename.slice(lastDotIndex + 1).toLowerCase();
}

function resolveAssetFormat(
  resource: CloudinaryResource,
  dto: UploadCompleteRequestDto,
): string | undefined {
  if (
    typeof resource.format === "string" &&
    resource.format.trim().length > 0
  ) {
    return resource.format.trim().toLowerCase();
  }

  const fallbackExtension =
    extractExtension(resource.original_filename ?? dto.originalFilename) ??
    extractExtension(resource.public_id);

  return fallbackExtension;
}

function extractBasenameFromPublicId(publicId: string): string {
  const idx = publicId.lastIndexOf("/");
  const base = idx >= 0 ? publicId.slice(idx + 1) : publicId;
  const trimmed = base.trim();

  if (!trimmed) {
    throw new HttpException(
      422,
      ErrorCodes.VALIDATION_ERROR,
      "Invalid asset public id",
    );
  }

  return trimmed;
}

function resolveAssetSubfolder(row: AssetRow): string {
  const isRaw = row.resourceType === FILE_RESOURCE_TYPE;
  const candidates = isRaw ? PREDEFINED_FILE_FOLDERS : PREDEFINED_FOLDERS;

  for (const sub of candidates) {
    if (row.folder === sub) {
      return sub;
    }
  }

  for (const sub of candidates) {
    const prefix = isRaw ? buildFilesFolder(sub) : buildImageFolder(sub);
    if (row.publicId.startsWith(`${prefix}/`)) {
      return sub;
    }
  }

  throw new HttpException(
    422,
    ErrorCodes.VALIDATION_ERROR,
    "Cannot resolve asset folder",
  );
}

function assertAllowedMoveTarget(resourceType: string, folder: string): void {
  const isRaw = resourceType === FILE_RESOURCE_TYPE;
  const allowed = isRaw ? PREDEFINED_FILE_FOLDERS : PREDEFINED_FOLDERS;

  if (!(allowed as readonly string[]).includes(folder)) {
    throw new HttpException(
      422,
      ErrorCodes.VALIDATION_ERROR,
      isRaw ? "Unsupported file folder" : "Unsupported image folder",
    );
  }
}

type CloudinaryFolderModeSetting = "dynamic" | "fixed";

async function getCloudinaryFolderMode(): Promise<CloudinaryFolderModeSetting | null> {
  try {
    const result = (await cloudinary.api.config({
      settings: true,
    })) as { settings?: { folder_mode?: string } };
    const mode = result.settings?.folder_mode;
    if (mode === "dynamic" || mode === "fixed") {
      return mode;
    }
  } catch {
    return null;
  }

  return null;
}

async function syncMediaLibraryAssetFolder(params: {
  publicId: string;
  resourceType: string;
  assetFolder: string;
}): Promise<void> {
  await cloudinary.api.update(params.publicId, {
    resource_type: params.resourceType,
    type: "upload",
    asset_folder: params.assetFolder,
  });
}

function validateReplaceInput(
  resourceType: string,
  dto: ReplaceSignatureRequestDto,
): void {
  if (resourceType === "image") {
    if (!ALLOWED_MIME_TYPES.some((mimeType) => mimeType === dto.mimeType)) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "Unsupported image mime type",
      );
    }

    if (dto.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        `Image exceeds max size of ${MAX_FILE_SIZE_BYTES} bytes`,
      );
    }

    return;
  }

  if (resourceType === FILE_RESOURCE_TYPE) {
    if (
      !ALLOWED_FILE_MIME_TYPES.some((mimeType) => mimeType === dto.mimeType)
    ) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "Unsupported file mime type",
      );
    }

    if (dto.fileSize > MAX_FILE_SIZE_BYTES_FILES) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        `File exceeds max size of ${MAX_FILE_SIZE_BYTES_FILES} bytes`,
      );
    }

    return;
  }

  throw new HttpException(
    422,
    ErrorCodes.VALIDATION_ERROR,
    "Unsupported asset resource type for replace",
  );
}

export const assetService = {
  async generateUploadSignature(
    dto: UploadSignatureRequestDto,
    _userId: string,
  ): Promise<UploadSignatureResult> {
    const isImage = dto.assetType === "image";
    const targetFolder = isImage
      ? buildImageFolder(
          normalizeSubfolder(dto.folder, DEFAULT_IMAGE_SUBFOLDER),
        )
      : buildFilesFolder(
          normalizeSubfolder(dto.folder, DEFAULT_FILE_SUBFOLDER),
        );
    const publicId = buildUniquePublicId(dto.fileName);
    const timestamp = Math.floor(Date.now() / 1000);
    const tags = normalizeTags(dto.tags);
    const allowedFormats =
      isImage && dto.mimeType.split("/")[1]
        ? [dto.mimeType.split("/")[1]]
        : undefined;
    const resourceType: "image" | "raw" = isImage
      ? "image"
      : FILE_RESOURCE_TYPE;

    const paramsToSign: Record<string, string | number> = {
      folder: targetFolder,
      public_id: publicId,
      timestamp,
    };

    if (allowedFormats && allowedFormats.length > 0) {
      paramsToSign.allowed_formats = allowedFormats.join(",");
    }

    if (tags.length > 0) {
      paramsToSign.tags = tags.join(",");
    }

    const signature = cloudinaryV2.utils.api_sign_request(
      paramsToSign,
      cloudinary.config().api_secret ?? "",
    );

    return {
      upload: {
        signature,
        timestamp,
        apiKey: cloudinary.config().api_key ?? "",
        cloudName: cloudinary.config().cloud_name ?? "",
        publicId,
        folder: targetFolder,
        resourceType,
        allowedFormats,
        tags: tags.length > 0 ? tags.join(",") : undefined,
      },
      targetFolder,
    };
  },

  async finalizeUpload(
    dto: UploadCompleteRequestDto,
    userId: string,
  ): Promise<AssetResponseDto> {
    const existing = await assetRepository.findByPublicId(dto.publicId);

    if (existing) {
      return toAssetResponseDto(existing);
    }

    let resource: CloudinaryResource;

    try {
      resource = await cloudinary.api.resource(dto.publicId, {
        resource_type: dto.resourceType,
      });
    } catch (error) {
      if (isCloudinaryNotFoundError(error)) {
        throw new HttpException(
          409,
          ErrorCodes.VALIDATION_ERROR,
          "Asset does not exist in Cloudinary",
        );
      }

      throw new HttpException(
        502,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Failed to fetch asset metadata from Cloudinary",
      );
    }

    const normalizedTags = normalizeTags(
      Array.isArray(resource.tags) ? (resource.tags as string[]) : dto.tags,
    );

    try {
      const inserted = await assetRepository.insert({
        publicId: resource.public_id,
        cloudinaryUrl: resource.url,
        secureUrl: resource.secure_url,
        resourceType: resource.resource_type,
        format: resolveAssetFormat(resource, dto),
        width: typeof resource.width === "number" ? resource.width : undefined,
        height:
          typeof resource.height === "number" ? resource.height : undefined,
        bytes: Number(resource.bytes ?? 0),
        folder: resource.folder ?? dto.folder,
        filename:
          resource.original_filename ??
          dto.originalFilename ??
          getFilenameFallback(resource.public_id),
        originalFilename: resource.original_filename ?? dto.originalFilename,
        tags: normalizedTags,
        uploadedBy: userId,
      });

      return toAssetResponseDto(inserted);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        const duplicate = await assetRepository.findByPublicId(
          resource.public_id,
        );

        if (duplicate) {
          return toAssetResponseDto(duplicate);
        }
      }

      throw error;
    }
  },

  async generateReplaceSignature(
    id: string,
    dto: ReplaceSignatureRequestDto,
    _userId: string,
  ): Promise<ReplaceSignatureResult> {
    const existing = await assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundException("Asset", id);
    }

    validateReplaceInput(existing.resourceType, dto);

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string | number | boolean> = {
      public_id: existing.publicId,
      overwrite: true,
      invalidate: true,
      type: "upload",
      timestamp,
    };

    const allowedFormats =
      existing.resourceType === "image" && dto.mimeType.split("/")[1]
        ? [dto.mimeType.split("/")[1]]
        : undefined;

    if (allowedFormats && allowedFormats.length > 0) {
      paramsToSign.allowed_formats = allowedFormats.join(",");
    }

    const signature = cloudinaryV2.utils.api_sign_request(
      paramsToSign,
      cloudinary.config().api_secret ?? "",
    );

    return {
      upload: {
        signature,
        timestamp,
        apiKey: cloudinary.config().api_key ?? "",
        cloudName: cloudinary.config().cloud_name ?? "",
        publicId: existing.publicId,
        resourceType:
          existing.resourceType === "image" ? "image" : FILE_RESOURCE_TYPE,
        overwrite: true,
        invalidate: true,
        type: "upload",
        allowedFormats,
      },
    };
  },

  async finalizeReplace(
    id: string,
    dto: ReplaceCompleteRequestDto,
    _userId: string,
  ): Promise<AssetResponseDto> {
    const existing = await assetRepository.findById(id);

    if (!existing) {
      throw new NotFoundException("Asset", id);
    }

    if (dto.publicId !== existing.publicId) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "Replacement publicId must match the existing asset publicId",
      );
    }

    let resource: CloudinaryResource;

    try {
      resource = await cloudinary.api.resource(existing.publicId, {
        resource_type: existing.resourceType,
      });
    } catch (error) {
      if (isCloudinaryNotFoundError(error)) {
        throw new HttpException(
          409,
          ErrorCodes.VALIDATION_ERROR,
          "Asset does not exist in Cloudinary",
        );
      }

      throw new HttpException(
        502,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Failed to fetch asset metadata from Cloudinary",
      );
    }

    const updated = await assetRepository.updateAssetMetadata(id, {
      cloudinaryUrl: resource.url,
      secureUrl: resource.secure_url,
      format: resolveAssetFormat(resource, {
        publicId: resource.public_id,
        resourceType: existing.resourceType as "image" | "video" | "raw",
        bytes: Number(resource.bytes ?? 0),
        folder: existing.folder,
        originalFilename: resource.original_filename,
      }),
      width: typeof resource.width === "number" ? resource.width : undefined,
      height: typeof resource.height === "number" ? resource.height : undefined,
      bytes: Number(resource.bytes ?? 0),
      originalFilename: resource.original_filename,
    });

    if (!updated) {
      throw new NotFoundException("Asset", id);
    }

    return toAssetResponseDto(updated);
  },

  async listAssets(query: AssetsListQueryDto): Promise<{
    rows: AssetResponseDto[];
    total: number;
  }> {
    const result = await assetRepository.list(query);

    return {
      rows: result.rows.map(toAssetResponseDto),
      total: result.total,
    };
  },

  async listAllTags(): Promise<{ tags: string[] }> {
    const tags = await assetRepository.listAllDistinctTags();
    return { tags };
  },

  async getAsset(id: string): Promise<AssetResponseDto> {
    const row = await assetRepository.findById(id);

    if (!row) {
      throw new NotFoundException("Asset", id);
    }

    return toAssetResponseDto(row);
  },

  async deleteAsset(id: string): Promise<{ success: true }> {
    const row = await assetRepository.findById(id);

    if (!row) {
      throw new NotFoundException("Asset", id);
    }

    try {
      await cloudinary.uploader.destroy(row.publicId, {
        resource_type: row.resourceType,
      });
    } catch {
      throw new HttpException(
        502,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Failed to delete asset in Cloudinary",
      );
    }

    await assetRepository.deleteById(id);

    return { success: true };
  },

  async updateAssetFilename(
    id: string,
    dto: UpdateAssetFilenameRequestDto,
  ): Promise<AssetResponseDto> {
    const row = await assetRepository.findById(id);

    if (!row) {
      throw new NotFoundException("Asset", id);
    }

    const updated = await assetRepository.updateFilename(id, dto.filename);

    if (!updated) {
      throw new NotFoundException("Asset", id);
    }

    return toAssetResponseDto(updated);
  },

  async updateAssetTags(
    id: string,
    dto: UpdateAssetTagsRequestDto,
    _userId: string,
  ): Promise<AssetResponseDto> {
    const row = await assetRepository.findById(id);

    if (!row) {
      throw new NotFoundException("Asset", id);
    }

    const normalizedTags = normalizeTags(dto.tags);
    const updated = await assetRepository.updateTags(id, normalizedTags);

    if (!updated) {
      throw new NotFoundException("Asset", id);
    }

    return toAssetResponseDto(updated);
  },

  async moveAssetToFolder(
    id: string,
    dto: MoveAssetRequestDto,
    _userId: string,
  ): Promise<AssetResponseDto> {
    const row = await assetRepository.findById(id);

    if (!row) {
      throw new NotFoundException("Asset", id);
    }

    const targetFolder = dto.folder.trim();
    assertAllowedMoveTarget(row.resourceType, targetFolder);

    const currentSubfolder = resolveAssetSubfolder(row);

    if (currentSubfolder === targetFolder) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "Asset is already in this folder",
      );
    }

    const isRaw = row.resourceType === FILE_RESOURCE_TYPE;
    const newFolderPath = isRaw
      ? buildFilesFolder(targetFolder)
      : buildImageFolder(targetFolder);
    const oldFolderPath = isRaw
      ? buildFilesFolder(currentSubfolder)
      : buildImageFolder(currentSubfolder);

    const basename = extractBasenameFromPublicId(row.publicId);
    const oldPublicId = row.publicId;
    const newPublicId = `${newFolderPath}/${basename}`;

    const renameOptions = {
      resource_type: row.resourceType,
      invalidate: true,
    } as const;

    try {
      await cloudinary.uploader.rename(oldPublicId, newPublicId, renameOptions);
    } catch {
      throw new HttpException(
        502,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Failed to move asset in Cloudinary",
      );
    }

    let resource: CloudinaryResource;

    try {
      resource = await cloudinary.api.resource(newPublicId, {
        resource_type: row.resourceType,
      });
    } catch (error) {
      try {
        await cloudinary.uploader.rename(
          newPublicId,
          oldPublicId,
          renameOptions,
        );
      } catch {
        // Best-effort rollback; reconcile manually if this fails.
      }

      if (isCloudinaryNotFoundError(error)) {
        throw new HttpException(
          502,
          ErrorCodes.INTERNAL_SERVER_ERROR,
          "Moved asset was not found in Cloudinary",
        );
      }

      throw new HttpException(
        502,
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Failed to verify moved asset in Cloudinary",
      );
    }

    const folderMode = await getCloudinaryFolderMode();
    let syncedMediaLibraryFolder = false;

    if (folderMode === "dynamic") {
      try {
        await syncMediaLibraryAssetFolder({
          publicId: newPublicId,
          resourceType: row.resourceType,
          assetFolder: newFolderPath,
        });
        syncedMediaLibraryFolder = true;
      } catch {
        try {
          await cloudinary.uploader.rename(
            newPublicId,
            oldPublicId,
            renameOptions,
          );
        } catch {
          // Best-effort rollback
        }

        throw new HttpException(
          502,
          ErrorCodes.INTERNAL_SERVER_ERROR,
          "Failed to sync Media Library folder in Cloudinary",
        );
      }
    } else if (folderMode === null) {
      try {
        await syncMediaLibraryAssetFolder({
          publicId: newPublicId,
          resourceType: row.resourceType,
          assetFolder: newFolderPath,
        });
        syncedMediaLibraryFolder = true;
      } catch {
        // Likely fixed folder mode or unsupported; delivery path still matches public_id.
      }
    }

    try {
      const updated = await assetRepository.updateAfterFolderMove(id, {
        publicId: resource.public_id,
        cloudinaryUrl: resource.url,
        secureUrl: resource.secure_url,
        folder: targetFolder,
      });

      if (!updated) {
        throw new NotFoundException("Asset", id);
      }

      return toAssetResponseDto(updated);
    } catch (error) {
      try {
        await cloudinary.uploader.rename(
          newPublicId,
          oldPublicId,
          renameOptions,
        );

        if (syncedMediaLibraryFolder) {
          try {
            await syncMediaLibraryAssetFolder({
              publicId: oldPublicId,
              resourceType: row.resourceType,
              assetFolder: oldFolderPath,
            });
          } catch {
            // Best-effort restore Media Library path
          }
        }
      } catch {
        // Best-effort rollback
      }

      throw error;
    }
  },
};
