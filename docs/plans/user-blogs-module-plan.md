# Implementation Plan: User Blogs Module (`user-blogs`)

> **Specification Reference:** Adheres strictly to [`docs/BACKEND_MODULE_GUIDE.md`](../BACKEND_MODULE_GUIDE.md) and architectural patterns observed in the `books` and `courses` modules.

---

## 1. Overview & Objectives

Create a dedicated **User Blogs** backend module (`src/server/modules/user-blogs/`) tailored for individual user articles and personal knowledge publishing.

### Key Distinctions from Platform Blogs (`src/server/modules/blogs/`):

| Feature              | Platform Blogs (`blogs`)                                    | User Blogs (`user-blogs`)                                                        |
| :------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------- |
| **Audience / Owner** | Platform-wide content authored by admins/staff (`authorId`) | Multi-tenant user content owned by authenticated users (`userId`)                |
| **Localization**     | Dual language (`titleAr`, `titleEn`, `contentAr`, etc.)     | Single language input per blog (`title`, `description`, `content`, `excerpt`)    |
| **Featured Post**    | Has `isFeatured: boolean`                                   | Not featured (`isFeatured` omitted)                                              |
| **Public Knowledge** | Public site discovery `/blogs`                              | `isPublic: boolean` controls user's Public Knowledge Profile sharing             |
| **Cover Media**      | Admin CDN URL                                               | User-uploaded media stored in Cloudflare R2 via `userMediaFile` (`coverImageId`) |
| **Entitlements**     | Unlimited (Admin-only)                                      | Free/Trial: **3 blogs** (`maxBlogs: 3`), Pro: **Unlimited**                      |

---

## 2. Shared Logic & Code Reusability Strategy

To avoid duplication between `blogs` and `user-blogs`, we extract shared logic into reusable modules:

1. **Shared Status & Constants:**
   - Reuse `BlogStatus = "draft" | "published" | "archived"` from `src/shared/types/blog.types.ts`.
   - Reuse/share `blogStatusEnum` across Drizzle entities (or export shared enum values `["draft", "published", "archived"]`).
   - Shared validation constants in `src/shared/constants/blog.constants.ts` (e.g. `BLOG_STATUSES`, default limits, tag rules).

2. **Shared Content Helpers (`src/shared/utils/blog-helpers.ts` or `src/server/modules/blogs/blog.utils.ts`):**
   - **Reading Time Calculator:** `calculateReadingMinutes(content: string, wpm = 200): number`
     - Strips HTML/Markdown and calculates reading time (minimum 1 min).
   - **Excerpt Generator:** `generateExcerpt(content: string, maxLength = 250): string`
     - Auto-generates clean plain-text excerpt if user does not provide one.
   - **Slug Normalizer / Generator:** `slugify(title: string): string`
     - Generates URL-friendly slugs for Arabic and English titles.
   - **Publication Date Helper:** Sets `publishDate = new Date()` when transition to `"published"` occurs without an explicit date.

---

## 3. Database Schema (`user_blogs`)

### Table Definition: `src/server/modules/user-blogs/user-blog.entity.ts`

```typescript
export const userBlog = pgTable(
  "user_blogs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    coverImageId: text("cover_image_id").references(() => userMediaFile.id, {
      onDelete: "set null",
    }),
    excerpt: text("excerpt"),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: blogStatusEnum("status").notNull().default("draft"),
    publishDate: timestamp("publish_date"),
    isPublic: boolean("is_public").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date())
      .notNull(),
  },
  (table) => [
    // Multi-tenant fast lookup by user and status
    index("user_blogs_user_status_created_idx").using(
      "btree",
      asc(table.userId),
      asc(table.status),
      desc(table.createdAt),
    ),
    // Slugs are unique per user to prevent collision across different users
    uniqueIndex("user_blogs_user_slug_unique_idx").on(table.userId, table.slug),
    // Public profile filtering index
    index("user_blogs_user_public_idx").using(
      "btree",
      asc(table.userId),
      asc(table.isPublic),
      desc(table.publishedAt),
    ),
    // Fast tag filtering
    index("user_blogs_tags_gin_idx").using("gin", table.tags),
  ],
);
```

### Schema Registration:

- Re-export in `src/server/db/schema.ts`:
  ```typescript
  export * from "@/server/modules/user-blogs/user-blog.entity";
  ```

---

## 4. Entitlements & Subscription Limits

1. **Update `PlanFeatures` interface** in `src/shared/types/subscription.types.ts`:
   ```typescript
   export interface PlanFeatures {
     // ...
     maxBlogs: number | null;
   }
   ```
2. **Update Plan Tiers** in `src/server/modules/subscriptions/subscription-entitlements.ts`:
   - `FREE`: `maxBlogs: 3`
   - `TRIAL`: `maxBlogs: 3`
   - `PRO`: `maxBlogs: null` (unlimited)
3. **Add Guard Exception** in `src/server/exceptions/exceptions.ts`:
   - Extend `PlanLimitKind` to include `"user_blogs"`.
4. **Implement Entitlement Guard** in `src/server/modules/subscriptions/entitlement-guards.ts`:

   ```typescript
   export async function assertCanCreateUserBlog(
     userId: string,
   ): Promise<void> {
     const { features } = await subscriptionService.getEntitlements(userId);
     const max = features.maxBlogs;
     if (max == null) return;

     const count = await userBlogRepository.countByUserId(userId);
     if (count >= max) {
       throw new PlanLimitExceededException("user_blogs", max);
     }
   }
   ```

---

## 5. Media & Cover Management (R2 & userMedia)

Mirroring the established pattern from `books` (`book-cover.service.ts`) and `courses` (`course-thumbnail.service.ts`):

1. **Register Usage Type** in `src/shared/constants/user-media.constants.ts`:
   ```typescript
   export const USER_MEDIA_USAGE_TYPE = {
     // ...
     USER_BLOG_COVER: "user_blog_cover",
   } as const;
   ```
2. **Key Builder** in `src/server/modules/user-blogs/r2-user-blog-cover.keys.ts`:
   - Path format: `user-media/<userId>/user-blogs/<blogId>/cover.<ext>`
3. **Cover Service** in `src/server/modules/user-blogs/user-blog-cover.service.ts`:
   - `presignUpload(userId, blogId, dto)`
   - `completeUpload(userId, blogId, dto)`: creates record in `user_media_files` and updates `user_blogs.coverImageId`.
   - `deleteCover(userId, blogId)`: deletes R2 object and clears `coverImageId`.

---

## 6. Detailed File Breakdown & Architecture

### Phase 1: Shared Types & Reusable Helpers

- [ ] `src/shared/types/user-blog.types.ts`:
  - `UserBlogDTO`: `id`, `userId`, `title`, `description`, `slug`, `content`, `coverImageId`, `coverImageUrl`, `excerpt`, `readingMinutes`, `tags`, `status`, `publishDate`, `isPublic`, `publishedAt`, `createdAt`, `updatedAt`.
  - `UserBlogListItemDTO`: Omit `content` from `UserBlogDTO` to keep listing payloads lightweight.
  - Query parameters and filter types.
- [ ] `src/shared/utils/blog-helpers.ts`:
  - Reusable reading minutes calculation, excerpt generator, and slug sanitizer.

### Phase 2: DTOs & Validation

- [ ] `src/server/modules/user-blogs/user-blog.dto.ts`:
  - `createUserBlogSchema`: strictly **no** `userId`. Auto-calculates `readingMinutes` and `excerpt` if not provided.
  - `updateUserBlogSchema`: partial of create.
  - `listUserBlogsQuerySchema`: `q`, `status`, `tag`, `visibility`, `isPublic`, `sortBy`, `sortOrder`, `page`, `limit`.
  - `userBlogCoverPresignRequestSchema`, `userBlogCoverCompleteRequestSchema`.

### Phase 3: Repository (`user-blog.repository.ts`)

- [ ] `countByUserId(userId: string): Promise<number>`
- [ ] `findManyByUserId(userId, filters, pagination)`: Left joins `userMediaFile` on `coverImageId` for `coverImageUrl`. Performs parallel query with `Promise.all` for count and items.
- [ ] `findByIdAndUserId(id, userId)`: Strict ownership isolation.
- [ ] `findBySlugAndUserId(slug, userId)`
- [ ] `existsBySlug(slug, userId, excludeId?)`
- [ ] `create(data)`
- [ ] `update(id, userId, data)`
- [ ] `delete(id, userId)`

### Phase 4: Service (`user-blog.service.ts`)

- [ ] `listUserBlogs(userId, filters, pagination)`
- [ ] `getUserBlogById(userId, id)`
- [ ] `createUserBlog(userId, dto)`: calls `assertCanCreateUserBlog(userId)`, checks slug uniqueness, applies fallback reading time/excerpt.
- [ ] `updateUserBlog(userId, id, dto)`: verifies ownership, checks slug collision, updates publication status.
- [ ] `deleteUserBlog(userId, id)`: removes linked cover from R2 and deletes record.
- [ ] Private `toDTO(row)` and `toListDTO(row)` mappers.

### Phase 5: Controller (`user-blog.controller.ts`)

- [ ] Plain object `userBlogController` with standard `ok()` envelope.
- [ ] Methods: `list`, `getById`, `create`, `update`, `delete`.
- [ ] Cover methods: `presignCover`, `completeCover`, `deleteCover`.

### Phase 6: API Routes & Swagger JSDoc

- [ ] `src/app/api/user-blogs/route.ts` (GET list, POST create) + `@swagger` annotations.
- [ ] `src/app/api/user-blogs/[id]/route.ts` (GET, PUT, DELETE) + `resolveRouteParams` + `@swagger` annotations.
- [ ] `src/app/api/user-blogs/[id]/cover/presign/route.ts` (POST)
- [ ] `src/app/api/user-blogs/[id]/cover/complete/route.ts` (POST)
- [ ] `src/app/api/user-blogs/[id]/cover/route.ts` (DELETE)

### Phase 7: Public Knowledge Integration

- [ ] Extend `src/server/modules/public-knowledge/public-knowledge.repository.ts`:
  - `findPublicBlogsByUserId(userId: string)`
  - `findPublicBlogBySlugAndUserId(slug: string, userId: string)`
  - Include `publicBlogsCount` in `PublicKnowledgeProfileDTO`.

### Phase 8: Client SDK

- [ ] `src/lib/api/user-blogs.api.ts`: typed HTTP client using `request` and `requestWithMeta`.
- [ ] `src/lib/api/api-client.ts`: register `userBlogs: userBlogsApi`.

---

## 7. Migration & Verification Plan

1. **TypeScript Checks:**
   - Run `pnpm typecheck` to ensure no interface or DTO mismatches.
2. **Database Migration:**
   - Run `pnpm db:generate` to generate Drizzle SQL migration for `user_blogs`.
   - Run `pnpm db:migrate` to apply migrations.
3. **Lint & Code Style:**
   - Run `pnpm lint` and `pnpm check:guidelines`.
4. **E2E / Smoke Testing:**
   - Verify listing, creating (up to 3 on free tier), cover upload, and deletion.
