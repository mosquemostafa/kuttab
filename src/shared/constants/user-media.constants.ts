/** User-uploaded media stored in R2 (S3 API). Same image rules as avatars. */
export const USER_MEDIA_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "image/avif",
] as const;

export type UserMediaAllowedImageType =
  (typeof USER_MEDIA_ALLOWED_IMAGE_TYPES)[number];

export const USER_MEDIA_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const USER_MEDIA_OBJECT_KEY_PREFIX = "user-media";

/** Values stored in `user_media_files.usage_type`. */
export const USER_MEDIA_USAGE_TYPE = {
  JOURNAL_DAILY_COVER: "journal_daily_cover",
  BOOK_COVER: "book_cover",
  COURSE_THUMBNAIL: "course_thumbnail",
  VIDEO_THUMBNAIL: "video_thumbnail",
  VIDEO_PLAYLIST_COVER: "video_playlist_cover",
  USER_BLOG_COVER: "user_blog_cover",
  EDITOR_IMAGE: "editor_image",
} as const;

export type UserMediaUsageType =
  (typeof USER_MEDIA_USAGE_TYPE)[keyof typeof USER_MEDIA_USAGE_TYPE];
