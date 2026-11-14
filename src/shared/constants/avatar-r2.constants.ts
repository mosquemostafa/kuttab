/** Avatar uploads to R2: no SVG (unsafe in many contexts). */
export const AVATAR_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AvatarAllowedContentType =
  (typeof AVATAR_ALLOWED_CONTENT_TYPES)[number];

export const AVATAR_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const AVATAR_OBJECT_KEY_PREFIX = "avatars";
