import { createId } from "@paralleldrive/cuid2";

import { r2AvatarStorageEnabled } from "@/server/lib/env";
import {
  copyR2Object,
  deleteR2Object,
  publicUrlForR2ObjectKey,
} from "@/server/lib/r2";
import { userMediaRepository } from "@/server/modules/user-media/user-media.repository";
import {
  USER_MEDIA_OBJECT_KEY_PREFIX,
  type UserMediaUsageType,
} from "@/shared/constants/user-media.constants";

export async function cloneUserMediaFile({
  mediaId,
  sourceUserId,
  userId,
  targetEntityId,
  usageType,
}: {
  mediaId: string | null | undefined;
  sourceUserId?: string;
  userId: string;
  targetEntityId: string;
  usageType: UserMediaUsageType;
}): Promise<string | null> {
  if (!mediaId) {
    return null;
  }

  const lookupUserId = sourceUserId ?? userId;
  let sourceMedia = await userMediaRepository.findByIdAndUploadedBy(
    mediaId,
    lookupUserId,
  );
  if (!sourceMedia) {
    sourceMedia = await userMediaRepository.findById(mediaId);
  }
  if (!sourceMedia) {
    return null;
  }

  const ext =
    sourceMedia.format ??
    sourceMedia.objectKey.split(".").pop()?.toLowerCase() ??
    "jpg";

  const newObjectKey = `${USER_MEDIA_OBJECT_KEY_PREFIX}/${usageType}/${userId}/${targetEntityId}/${createId()}.${ext}`;

  if (r2AvatarStorageEnabled && !sourceMedia.objectKey.startsWith("legacy/")) {
    try {
      await copyR2Object(sourceMedia.objectKey, newObjectKey);
    } catch (error) {
      console.error("Failed to copy media in R2 during duplication:", error);
      return null;
    }
  }

  const newMediaId = createId();
  const publicUrl = publicUrlForR2ObjectKey(newObjectKey);

  try {
    const created = await userMediaRepository.insert({
      id: newMediaId,
      objectKey: newObjectKey,
      publicUrl,
      resourceType: sourceMedia.resourceType,
      usageType,
      format: sourceMedia.format,
      width: sourceMedia.width,
      height: sourceMedia.height,
      bytes: sourceMedia.bytes,
      originalFilename: sourceMedia.originalFilename,
      uploadedBy: userId,
    });

    return created.id;
  } catch (error) {
    console.error("Failed to insert cloned media record:", error);
    if (r2AvatarStorageEnabled && !newObjectKey.startsWith("legacy/")) {
      try {
        await deleteR2Object(newObjectKey);
      } catch {
        // Best effort cleanup
      }
    }
    return null;
  }
}

/**
 * Deletes a cloned media record and its corresponding R2 object.
 * Used for rollbacks when the outer database transaction or entity creation fails.
 */
export async function cleanupClonedUserMediaFile(
  mediaId: string | null | undefined,
): Promise<void> {
  if (!mediaId) {
    return;
  }

  try {
    const media = await userMediaRepository.findById(mediaId);
    if (!media) {
      return;
    }

    if (r2AvatarStorageEnabled && !media.objectKey.startsWith("legacy/")) {
      try {
        await deleteR2Object(media.objectKey);
      } catch (err) {
        console.error("Failed to delete R2 object during cleanup:", err);
      }
    }

    await userMediaRepository.deleteById(mediaId);
  } catch (error) {
    console.error("Failed to cleanup cloned user media file:", error);
  }
}
