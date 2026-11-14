import { and, eq, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { userMediaFile } from "@/server/modules/user-media/user-media.entity";

type NewUserMediaFileRow = {
  id: string;
  objectKey: string;
  publicUrl: string;
  resourceType: string;
  usageType: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number;
  originalFilename: string | null;
  uploadedBy: string;
};

export const userMediaRepository = {
  async insert(row: NewUserMediaFileRow) {
    const [created] = await db.insert(userMediaFile).values(row).returning();
    return created;
  },

  async findById(id: string) {
    const [row] = await db
      .select()
      .from(userMediaFile)
      .where(eq(userMediaFile.id, id))
      .limit(1);
    return row ?? null;
  },

  async findByIdAndUploadedBy(id: string, uploadedBy: string) {
    const [row] = await db
      .select()
      .from(userMediaFile)
      .where(
        and(eq(userMediaFile.id, id), eq(userMediaFile.uploadedBy, uploadedBy)),
      )
      .limit(1);
    return row ?? null;
  },

  async deleteById(id: string): Promise<boolean> {
    const deleted = await db
      .delete(userMediaFile)
      .where(eq(userMediaFile.id, id))
      .returning({ id: userMediaFile.id });
    return deleted.length > 0;
  },

  async countByUploadedByAndUsageType(
    uploadedBy: string,
    usageType: string,
  ): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userMediaFile)
      .where(
        and(
          eq(userMediaFile.uploadedBy, uploadedBy),
          eq(userMediaFile.usageType, usageType),
        ),
      );

    return Number(row?.count ?? 0);
  },
};
