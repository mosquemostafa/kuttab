import { createId } from "@paralleldrive/cuid2";

import {
  USER_MEDIA_OBJECT_KEY_PREFIX,
  USER_MEDIA_USAGE_TYPE,
  type UserMediaAllowedImageType,
} from "@/shared/constants/user-media.constants";

const MIME_TO_EXT: Record<UserMediaAllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function buildEditorImageObjectKey(
  userId: string,
  contentType: UserMediaAllowedImageType,
): string {
  const ext = MIME_TO_EXT[contentType] ?? "jpg";
  return `${USER_MEDIA_OBJECT_KEY_PREFIX}/${USER_MEDIA_USAGE_TYPE.EDITOR_IMAGE}/${userId}/${createId()}.${ext}`;
}

/** Validates key belongs to user and conforms to editor_image layout. */
export function parseEditorImageObjectKey(
  objectKey: string,
  userId: string,
): { fileId: string } | null {
  const prefix = `${USER_MEDIA_OBJECT_KEY_PREFIX}/${USER_MEDIA_USAGE_TYPE.EDITOR_IMAGE}/${userId}/`;
  if (!objectKey.startsWith(prefix)) {
    return null;
  }
  const rest = objectKey.slice(prefix.length);
  if (!rest || rest.includes("/") || !rest.includes(".")) {
    return null;
  }
  const fileId = rest.slice(0, rest.lastIndexOf("."));
  return { fileId };
}
