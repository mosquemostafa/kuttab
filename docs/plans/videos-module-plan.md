# Implementation Plan: Videos & Video Playlists Module

> **Specification Reference:** Adheres strictly to [`docs/BACKEND_MODULE_GUIDE.md`](../BACKEND_MODULE_GUIDE.md) and architectural patterns from `books` and `courses`.

---

## 1. Overview & Objectives

Implement a comprehensive, modular backend feature for **Videos & Video Playlists** (`src/server/modules/videos/`), supporting:

- Single video tracking with status (`not_started`, `in_progress`, `completed`), watch-next queue (`isInWatchNext`), tags, bookmark notes, and rich Markdown notes.
- Playlists with custom ordering and a many-to-many relationship table (`video_playlist_items`) with unique constraints.
- Automatic YouTube video thumbnail extraction with fallback/custom Cloudflare R2 image upload (identical to book covers).
- Automatic timestamping (`completedAt` set when status transitions to `completed`, cleared when reverted).
- Subscription entitlements enforcement (`maxVideos`, `maxVideosPlaylists`).
- Resource efficiency: excluding heavy `notes` content from all list endpoints.
- Strict multi-tenancy, cross-user isolation, and user-friendly conflict prevention (e.g., unique URLs per user, duplicate video-in-playlist prevention).

---

## 2. Architecture & File Structure

```
src/
├── app/api/
│   ├── videos/
│   │   ├── route.ts                                    # GET (list videos without notes), POST (create video)
│   │   ├── [id]/
│   │   │   ├── route.ts                                # GET (detail with notes), PUT (update), DELETE
│   │   │   └── thumbnail/
│   │   │       ├── route.ts                            # DELETE (remove custom thumbnail)
│   │   │       ├── presign/route.ts                    # POST (R2 upload presign)
│   │   │       └── complete/route.ts                   # POST (R2 upload complete)
│   └── video-playlists/
│       ├── route.ts                                    # GET (list playlists), POST (create playlist)
│       └── [id]/
│           ├── route.ts                                # GET (detail with items), PUT, DELETE
│           ├── cover/
│           │   ├── route.ts                            # DELETE custom cover
│           │   ├── presign/route.ts                    # POST R2 presign
│           │   └── complete/route.ts                   # POST R2 complete
│           └── videos/
│               ├── route.ts                            # POST (add video to playlist)
│               ├── [videoId]/route.ts                  # DELETE (remove video from playlist)
│               └── reorder/route.ts                    # PATCH (reorder videos in playlist)
├── server/
│   ├── db/schema.ts                                    # Export entities
│   ├── modules/
│   │   ├── subscriptions/
│   │   │   ├── entitlement-guards.ts                   # assertCanCreateVideo, assertCanCreateVideoPlaylist
│   │   │   └── subscription-entitlements.ts            # maxVideos, maxVideosPlaylists plan limits
│   │   └── videos/
│   │       ├── video.entity.ts                         # videos, video_playlists, video_playlist_items
│   │       ├── video.dto.ts                            # Zod schemas (videos + playlists)
│   │       ├── video.repository.ts                     # Drizzle queries & data access
│   │       ├── video.service.ts                        # Business logic, YouTube extractor, toDTO
│   │       ├── video-media.service.ts                  # R2 thumbnail and cover handling
│   │       ├── r2-video-media.keys.ts                  # Object key generators for R2
│   │       ├── video.controller.ts                     # Video HTTP controller
│   │       └── video-playlist.controller.ts            # Video Playlist HTTP controller
│   └── exceptions/exceptions.ts                        # PlanLimitKind update
├── shared/
│   ├── constants/user-media.constants.ts               # Usage types: VIDEO_THUMBNAIL, VIDEO_PLAYLIST_COVER
│   ├── types/
│   │   ├── subscription.types.ts                       # PlanFeatures: maxVideos, maxVideosPlaylists
│   │   └── video.types.ts                              # VideoDTO, VideoListItemDTO, VideoPlaylistDTO, etc.
└── lib/api/
    ├── videos.api.ts                                   # Client SDK for videos & playlists
    └── api-client.ts                                   # Register apiClient.videos & apiClient.videoPlaylists
```

---

## 3. Database Schema (`src/server/modules/videos/video.entity.ts`)

### 3.1. Enums & Tables

```typescript
export const VIDEO_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
] as const;
export const videoStatusEnum = pgEnum("video_status", VIDEO_STATUSES);

// 1. Videos Table
export const video = pgTable(
  "videos",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    status: videoStatusEnum("status").notNull().default("not_started"),
    isInWatchNext: boolean("is_in_watch_next").notNull().default(false),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    thumbnailUrl: text("thumbnail_url"), // Holds auto-fetched YouTube thumbnail
    thumbnailImageId: text("thumbnail_image_id").references(
      () => userMediaFile.id,
      { onDelete: "set null" },
    ), // R2 custom thumbnail
    notes: text("notes"), // Markdown rich text
    bookmarkNote: text("bookmark_note"), // Where user stopped watching
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("videos_user_url_unique_idx").on(table.userId, table.url),
    index("videos_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
    index("videos_user_watch_next_idx").on(table.userId, table.isInWatchNext),
    index("videos_tags_gin_idx").using("gin", table.tags),
  ],
);

// 2. Video Playlists Table
export const videoPlaylist = pgTable(
  "video_playlists",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    coverImageUrl: text("cover_image_url"),
    coverImageId: text("cover_image_id").references(() => userMediaFile.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    index("video_playlists_user_created_idx").on(table.userId, table.createdAt),
  ],
);

// 3. Many-to-Many Relationship Table
export const videoPlaylistItem = pgTable(
  "video_playlist_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    playlistId: text("playlist_id")
      .notNull()
      .references(() => videoPlaylist.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => video.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("video_playlist_items_unique_idx").on(
      table.playlistId,
      table.videoId,
    ),
    index("video_playlist_items_order_idx").on(
      table.playlistId,
      table.position,
    ),
  ],
);
```

---

## 4. YouTube Thumbnail Detection Strategy

Helper in `src/server/modules/videos/video.service.ts`:

```typescript
export function extractYouTubeVideoId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.replace(/^(www\.|m\.)/, "").toLowerCase();

    if (hostname === "youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/v/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
    }

    if (hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    return null;
  } catch {
    return null;
  }
}
```

---

## 5. DTOs & Validation Schemas (`video.dto.ts`)

1. **`createVideoSchema`**:
   - Accepts: `title` (1-255), `url` (valid URL format), `status` (optional, default `not_started`), `isInWatchNext` (optional), `tags` (optional string array), `notes` (optional).
   - **Excludes**: `userId`, `completedAt`, `bookmarkNote`, `thumbnailImageId`.
2. **`updateVideoSchema`**:
   - Accepts partial of above + `bookmarkNote`.
3. **`listVideosQuerySchema`**:
   - `q` (title/tag search), `status`, `tag`, `isInWatchNext` (boolean coerce), `sortBy`, `sortOrder`, `page`, `limit`.
4. **`createVideoPlaylistSchema`**:
   - `title` (1-255), `description` (optional).
5. **`updateVideoPlaylistSchema`**:
   - Partial of create.
6. **`addVideoToPlaylistSchema`**:
   - `videoId` (cuid2/string), `position` (optional positive integer).
7. **`reorderPlaylistVideosSchema`**:
   - `orderedVideoIds: z.array(z.string()).min(1)`.

---

## 6. Business Logic, Ownership & Security Rules

1. **Strict User Scoping:**
   - Every single query or mutation filters with `userId` extracted securely from Better Auth session (`getUserId(req)`).
   - Helper `getOwnedVideo(userId, videoId)` throws `NotFoundException("Video", videoId)` if nonexistent or belongs to another user.
   - Helper `getOwnedPlaylist(userId, playlistId)` throws `NotFoundException("Video Playlist", playlistId)` if nonexistent or belongs to another user.
2. **Cross-User Playlist Protection:**
   - When adding a video to a playlist (`addVideoToPlaylist`), verify both `getOwnedPlaylist(userId, playlistId)` AND `getOwnedVideo(userId, videoId)`. A user cannot add another user's video to their playlist.
3. **Duplicate Prevention:**
   - Video URL uniqueness: `findByUrlAndUserId(url, userId)` throws `ConflictException("A video with this URL already exists in your library")`.
   - Playlist item uniqueness: If `(playlistId, videoId)` already exists in `video_playlist_items`, throws `ConflictException("This video is already in this playlist")`.
4. **Position Calculation:**
   - When adding a video without a position, assign `(maxCurrentPosition + 1)`.
   - When reordering, batch update positions `1..N` matching `orderedVideoIds`.
5. **Timestamp Transitions:**
   - On status change to `completed`: auto set `completedAt = new Date()`.
   - On status change to `not_started` or `in_progress`: auto reset `completedAt = null`.
6. **Resource Optimization (`notes` exclusion):**
   - `videoRepository.findManyByUserId()` selects only the metadata columns (omitting `notes`).
   - `videoService.listVideos()` returns `PaginatedResponse<VideoListItemDTO>`.
   - Full `VideoDTO` including `notes` is only returned by `getVideoById()`.
7. **Thumbnail Precedence:**
   - In `toVideoDTO()`:
     - `thumbnailImageUrl = customMediaFile.publicUrl ?? video.thumbnailUrl ?? null`.
     - When a custom R2 thumbnail is deleted, it reverts cleanly to `video.thumbnailUrl` (YouTube thumbnail if present).

---

## 7. Subscription Entitlements

Update Subscription Configuration:

- `PlanFeatures` in `src/shared/types/subscription.types.ts`:
  - `maxVideos: number | null;`
  - `maxVideosPlaylists: number | null;`
- Default limits in `src/server/modules/subscriptions/subscription-entitlements.ts`:
  - Free: `maxVideos: 10`, `maxVideosPlaylists: 2`
  - Trial: `maxVideos: 10`, `maxVideosPlaylists: 2`
  - Pro: `maxVideos: null`, `maxVideosPlaylists: null`
- Guards in `src/server/modules/subscriptions/entitlement-guards.ts`:
  - `assertCanCreateVideo(userId)`
  - `assertCanCreateVideoPlaylist(userId)`
- Exceptions in `src/server/exceptions/exceptions.ts`:
  - Extend `PlanLimitKind` with `"videos" | "video_playlists"`.

---

## 8. Step-by-Step Implementation Roadmap

1. **Step 1: Entitlements & Constants**
   - Update `user-media.constants.ts` with `VIDEO_THUMBNAIL` and `VIDEO_PLAYLIST_COVER`.
   - Update `subscription.types.ts`, `subscription-entitlements.ts`, and `exceptions.ts`.
2. **Step 2: Database Schema & Migration**
   - Create `src/server/modules/videos/video.entity.ts`.
   - Re-export in `src/server/db/schema.ts`.
   - Run `pnpm db:generate` to produce the Drizzle migration.
3. **Step 3: Types & DTOs**
   - Create `src/shared/types/video.types.ts`.
   - Create `src/server/modules/videos/video.dto.ts`.
4. **Step 4: Repository Layer**
   - Create `src/server/modules/videos/video.repository.ts`.
   - Implement paginated list (omitting notes), detail lookup, URL conflict checks, playlist queries, and item position reordering.
5. **Step 5: Media & Storage Service**
   - Create `r2-video-media.keys.ts` and `video-media.service.ts` for presigned PUT URLs, upload completions, and deletions.
6. **Step 6: Service Layer**
   - Create `src/server/modules/videos/video.service.ts`.
   - Implement ownership guards, YouTube parser, status/completion timestamping, and DTO mappings.
   - Implement `assertCanCreateVideo` and `assertCanCreateVideoPlaylist` in `entitlement-guards.ts`.
7. **Step 7: Controllers**
   - Create `src/server/modules/videos/video.controller.ts`.
   - Create `src/server/modules/videos/video-playlist.controller.ts`.
8. **Step 8: Route Handlers & Swagger**
   - Create all routes under `src/app/api/videos/` and `src/app/api/video-playlists/` with complete OpenAPI `@swagger` annotations and `compose(withErrorHandler, withAuth)`.
9. **Step 9: Client SDK**
   - Create `src/lib/api/videos.api.ts`.
   - Register in `src/lib/api/api-client.ts`.
10. **Step 10: Verification & Quality Checks**
    - Run `pnpm typecheck` and `pnpm lint`.
