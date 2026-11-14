import { sql } from "drizzle-orm";

import { db } from "@/server/db";

/**
 * Single DB `now()` for a snapshot so parallel queries share the same instant.
 * Normalizes to `Date` because node-pg may return timestamptz as a string.
 */
export async function getDbTimeAnchor(): Promise<Date> {
  const [row] = await db
    .select({ t: sql<Date>`now()` })
    .from(sql`(select 1) as _dual`);
  if (!row) {
    throw new Error("getDbTimeAnchor: select now() returned no row");
  }
  const raw = row.t;
  return raw instanceof Date ? raw : new Date(raw as string | number);
}
