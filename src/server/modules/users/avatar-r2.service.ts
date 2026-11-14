import { ErrorCodes } from "@/server/constants/error-codes";
import { HttpException } from "@/server/exceptions/http.exception";
import { NotFoundException } from "@/server/exceptions/exceptions";
import { r2AvatarStorageEnabled } from "@/server/lib/env";
import {
  deleteR2Object,
  headR2Object,
  presignAvatarPut,
  publicUrlForR2ObjectKey,
  tryParseR2ObjectKeyFromPublicUrl,
  buildAvatarObjectKey,
} from "@/server/lib/r2";
import {
  AVATAR_ALLOWED_CONTENT_TYPES,
  AVATAR_OBJECT_KEY_PREFIX,
  AVATAR_MAX_UPLOAD_BYTES,
  type AvatarAllowedContentType,
} from "@/shared/constants/avatar-r2.constants";
import type {
  AvatarCompleteRequestDto,
  AvatarPresignRequestDto,
} from "@/server/modules/users/avatar-r2.dto";
import { userRepository } from "@/server/modules/users/user.repository";
import { userService } from "@/server/modules/users/user.service";

const allowedContentTypeSet = new Set<string>(AVATAR_ALLOWED_CONTENT_TYPES);

function assertR2Enabled(): void {
  if (!r2AvatarStorageEnabled) {
    throw new HttpException(
      503,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      "Avatar upload to storage is not configured",
    );
  }
}

function assertAvatarKeyForUser(objectKey: string, userId: string): void {
  const prefix = `${AVATAR_OBJECT_KEY_PREFIX}/${userId}/`;
  if (!objectKey.startsWith(prefix)) {
    throw new HttpException(
      422,
      ErrorCodes.VALIDATION_ERROR,
      "Invalid avatar object key",
    );
  }
}

type AvatarPresignResult = {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
};

type AvatarCompleteResult = {
  imageUrl: string;
};

export const avatarR2Service = {
  async presignUpload(
    userId: string,
    dto: AvatarPresignRequestDto,
  ): Promise<AvatarPresignResult> {
    assertR2Enabled();

    if (dto.fileSize > AVATAR_MAX_UPLOAD_BYTES) {
      throw new HttpException(
        422,
        ErrorCodes.VALIDATION_ERROR,
        "File is too large",
      );
    }

    const contentType = dto.contentType as AvatarAllowedContentType;
    const objectKey = buildAvatarObjectKey(userId, contentType);
    const { uploadUrl, headers } = await presignAvatarPut(
      objectKey,
      contentType,
    );

    return { uploadUrl, objectKey, headers };
  },

  async completeUpload(
    userId: string,
    dto: AvatarCompleteRequestDto,
    requestHeaders: Headers,
  ): Promise<AvatarCompleteResult> {
    assertR2Enabled();

    assertAvatarKeyForUser(dto.objectKey, userId);

    const head = await headR2Object(dto.objectKey);

    const size = head.ContentLength ?? 0;
    if (size <= 0 || size > AVATAR_MAX_UPLOAD_BYTES) {
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

    const profile = await userRepository.findProfileById(userId);
    if (!profile) {
      throw new NotFoundException("User", userId);
    }

    const previousKey = tryParseR2ObjectKeyFromPublicUrl(profile.image);
    if (previousKey && previousKey !== dto.objectKey) {
      try {
        await deleteR2Object(previousKey);
      } catch {
        // Best-effort cleanup; new avatar is still applied.
      }
    }

    const imageUrl = publicUrlForR2ObjectKey(dto.objectKey);
    await userService.updateUserImage(userId, imageUrl, requestHeaders);

    return { imageUrl };
  },
};
