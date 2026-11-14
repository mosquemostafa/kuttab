import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { mediaFile } from "@/server/modules/assets/asset.entity";
import type { AssetsListQueryDto } from "@/server/modules/assets/asset.dto";

export type AssetRow = typeof mediaFile.$inferSelect;

function toFolderClause(folder?: string) {
  if (!folder) return undefined;
  return eq(mediaFile.folder, folder);
}

function toResourceTypeClause(
  resourceType?: AssetsListQueryDto["resourceType"],
) {
  if (!resourceType) return undefined;
  return eq(mediaFile.resourceType, resourceType);
}

function toFormatClause(format?: string) {
  if (!format) return undefined;
  return eq(mediaFile.format, format);
}

function toTagsClause(tags?: string[]) {
  if (!tags || tags.length === 0) return undefined;

  const terms = tags.map((tag) => tag.trim()).filter((t) => t.length > 0);
  if (terms.length === 0) return undefined;

  /** Each term must match at least one tag (case-insensitive substring). */
  const clauses = terms.map(
    (term) => sql`
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(${mediaFile.tags}) AS tag_row(tag_text)
        WHERE strpos(lower(tag_text), lower(${term})) > 0
      )
    `,
  );

  return clauses.length === 1 ? clauses[0] : and(...clauses);
}

function toQueryClause(q?: string) {
  if (!q) return undefined;

  const search = `%${q}%`;

  return or(
    ilike(mediaFile.filename, search),
    ilike(mediaFile.publicId, search),
  );
}

export const assetRepository = {
  async insert(data: {
    publicId: string;
    cloudinaryUrl: string;
    secureUrl: string;
    resourceType: string;
    format?: string;
    width?: number;
    height?: number;
    bytes: number;
    folder: string;
    filename: string;
    originalFilename?: string;
    tags?: string[];
    uploadedBy: string;
  }): Promise<AssetRow> {
    const [created] = await db
      .insert(mediaFile)
      .values({
        publicId: data.publicId,
        cloudinaryUrl: data.cloudinaryUrl,
        secureUrl: data.secureUrl,
        resourceType: data.resourceType,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
        folder: data.folder,
        filename: data.filename,
        originalFilename: data.originalFilename,
        tags: data.tags ?? [],
        uploadedBy: data.uploadedBy,
        updatedAt: new Date(),
      })
      .returning();

    return created;
  },

  async findById(id: string): Promise<AssetRow | null> {
    const [row] = await db
      .select()
      .from(mediaFile)
      .where(eq(mediaFile.id, id))
      .limit(1);

    return row ?? null;
  },

  async findByPublicId(publicId: string): Promise<AssetRow | null> {
    const [row] = await db
      .select()
      .from(mediaFile)
      .where(eq(mediaFile.publicId, publicId))
      .limit(1);

    return row ?? null;
  },

  async list(
    filters: AssetsListQueryDto,
  ): Promise<{ rows: AssetRow[]; total: number }> {
    const offset = (filters.page - 1) * filters.limit;
    const where = and(
      toQueryClause(filters.q),
      toFolderClause(filters.folder),
      toResourceTypeClause(filters.resourceType),
      toFormatClause(filters.format),
      toTagsClause(filters.tags),
    );

    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(mediaFile)
        .where(where)
        .orderBy(desc(mediaFile.createdAt))
        .limit(filters.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(mediaFile)
        .where(where),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async deleteById(id: string): Promise<void> {
    await db.delete(mediaFile).where(eq(mediaFile.id, id));
  },

  async updateFilename(id: string, filename: string): Promise<AssetRow | null> {
    const [updated] = await db
      .update(mediaFile)
      .set({
        filename,
        updatedAt: new Date(),
      })
      .where(eq(mediaFile.id, id))
      .returning();

    return updated ?? null;
  },

  async updateTags(id: string, tags: string[]): Promise<AssetRow | null> {
    const [updated] = await db
      .update(mediaFile)
      .set({
        tags,
        updatedAt: new Date(),
      })
      .where(eq(mediaFile.id, id))
      .returning();

    return updated ?? null;
  },

  async updateAssetMetadata(
    id: string,
    data: {
      cloudinaryUrl: string;
      secureUrl: string;
      format?: string;
      width?: number;
      height?: number;
      bytes: number;
      originalFilename?: string;
    },
  ): Promise<AssetRow | null> {
    const [updated] = await db
      .update(mediaFile)
      .set({
        cloudinaryUrl: data.cloudinaryUrl,
        secureUrl: data.secureUrl,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
        originalFilename: data.originalFilename,
        updatedAt: new Date(),
      })
      .where(eq(mediaFile.id, id))
      .returning();

    return updated ?? null;
  },

  async updateAfterFolderMove(
    id: string,
    data: {
      publicId: string;
      cloudinaryUrl: string;
      secureUrl: string;
      folder: string;
    },
  ): Promise<AssetRow | null> {
    const [updated] = await db
      .update(mediaFile)
      .set({
        publicId: data.publicId,
        cloudinaryUrl: data.cloudinaryUrl,
        secureUrl: data.secureUrl,
        folder: data.folder,
        updatedAt: new Date(),
      })
      .where(eq(mediaFile.id, id))
      .returning();

    return updated ?? null;
  },

  async listAllDistinctTags(): Promise<string[]> {
    const result = await db.execute<{ tag: string }>(
      sql`
        SELECT DISTINCT jsonb_array_elements_text(${mediaFile.tags}) AS tag
        FROM ${mediaFile}
        ORDER BY tag
      `,
    );

    return result.rows.map((row) => row.tag).filter(Boolean);
  },
};
