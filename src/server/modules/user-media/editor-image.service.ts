import { createId } from "@paralleldrive/cuid2";

import { db } from "@/server/db";
import { ErrorCodes } from "@/server/constants/error-codes";
import { HttpException } from "@/server/exceptions/http.exception";
import { r2AvatarStorageEnabled } from "@/server/lib/env";
import {
  headR2Object,
  presignR2PutObject,
  publicUrlForR2ObjectKey,
} from "@/server/lib/r2";
import {
  buildEditorImageObjectKey,
  parseEditorImageObjectKey,
} from "@/server/modules/user-media/r2-editor-image.keys";
import { userMediaFile } from "@/server/modules/user-media/user-media.entity";
import {
  USER_MEDIA_ALLOWED_IMAGE_TYPES,
  USER_MEDIA_MAX_IMAGE_BYTES,
  USER_MEDIA_USAGE_TYPE,
  type UserMediaAllowedImageType,
} from "@/shared/constants/user-media.constants";
import type {
  EditorImageCompleteRequestDto,
  EditorImagePresignRequestDto,
} from "@/server/modules/user-media/editor-image.dto";

const allowedContentTypeSet = new Set<string>(USER_MEDIA_ALLOWED_IMAGE_TYPES);

function assertR2Enabled(): void {
  if (!r2AvatarStorageEnabled) {
    throw new HttpException(
      503,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "User media upload to storage is not configured",
    );
  }
}

function extractFormatFromObjectKey(objectKey: string): string | null {
  const base = objectKey.split("/").pop()?.trim() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) {
    return null;
  }
  return base.slice(dot + 1).toLowerCase();
}

type EditorImagePresignResult = {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
};

type EditorImageCompleteResult = {
  url: string;
  mediaId: string;
};

export const editorImageR2Service = {
  async presignUpload(
    userId: string,
    dto: EditorImagePresignRequestDto,
  ): Promise<EditorImagePresignResult> {
    assertR2Enabled();

    if (dto.fileSize > USER_MEDIA_MAX_IMAGE_BYTES) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "File is too large",
      );
    }

    const contentType = dto.contentType as UserMediaAllowedImageType;
    const objectKey = buildEditorImageObjectKey(userId, contentType);
    const { uploadUrl, headers } = await presignR2PutObject(
      objectKey,
      contentType,
    );

    return { uploadUrl, objectKey, headers };
  },

  async completeUpload(
    userId: string,
    dto: EditorImageCompleteRequestDto,
  ): Promise<EditorImageCompleteResult> {
    assertR2Enabled();

    const parsed = parseEditorImageObjectKey(dto.objectKey, userId);
    if (!parsed) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "Invalid object key",
      );
    }

    const head = await headR2Object(dto.objectKey);
    const size = head.ContentLength ?? 0;
    if (size <= 0 || size > USER_MEDIA_MAX_IMAGE_BYTES) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "Uploaded file is missing or too large",
      );
    }

    const rawType = head.ContentType?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!allowedContentTypeSet.has(rawType)) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "Uploaded file has an unsupported type",
      );
    }

    const publicUrl = publicUrlForR2ObjectKey(dto.objectKey);
    const format =
      extractFormatFromObjectKey(dto.objectKey) ??
      rawType.split("/")[1]?.toLowerCase() ??
      null;

    const mediaId = createId();

    await db.insert(userMediaFile).values({
      id: mediaId,
      objectKey: dto.objectKey,
      publicUrl,
      resourceType: "image",
      usageType: USER_MEDIA_USAGE_TYPE.EDITOR_IMAGE,
      format,
      width: null,
      height: null,
      bytes: size,
      originalFilename: null,
      uploadedBy: userId,
    });

    return {
      url: publicUrl,
      mediaId,
    };
  },
};
