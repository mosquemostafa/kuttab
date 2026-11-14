import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/server/db";
import { coupon } from "@/server/modules/coupons/coupon.entity";
import type { CouponTypeEnum } from "@/shared/enums/coupon-type.enum";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

type CouponRow = typeof coupon.$inferSelect;

type ListCouponsFilters = {
  q?: string;
  type?: CouponTypeEnum;
  isActive?: boolean;
};

export const couponRepository = {
  async findMany(
    pagination: ParsedPagination,
    filters: ListCouponsFilters,
  ): Promise<{ items: CouponRow[]; total: number }> {
    const whereParts = [
      filters.type ? eq(coupon.type, filters.type) : undefined,
      typeof filters.isActive === "boolean"
        ? eq(coupon.isActive, filters.isActive)
        : undefined,
      filters.q
        ? or(
            ilike(coupon.code, `%${filters.q}%`),
            ilike(coupon.description, `%${filters.q}%`),
          )
        : undefined,
    ].filter(Boolean);

    const where = whereParts.length > 0 ? and(...whereParts) : undefined;

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(coupon)
        .where(where)
        .orderBy(desc(coupon.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(coupon)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findById(id: string): Promise<CouponRow | null> {
    const [row] = await db
      .select()
      .from(coupon)
      .where(eq(coupon.id, id))
      .limit(1);

    return row ?? null;
  },

  async findByCode(code: string): Promise<CouponRow | null> {
    const [row] = await db
      .select()
      .from(coupon)
      .where(eq(coupon.code, code))
      .limit(1);

    return row ?? null;
  },

  async create(
    values: Omit<CouponRow, "id" | "createdAt" | "updatedAt">,
  ): Promise<CouponRow> {
    const [created] = await db
      .insert(coupon)
      .values({
        ...values,
        id: createId(),
      })
      .returning();

    return created;
  },

  async update(
    id: string,
    patch: Partial<Omit<CouponRow, "id" | "createdAt" | "createdByUserId">>,
  ): Promise<CouponRow | null> {
    const [updated] = await db
      .update(coupon)
      .set({
        ...patch,
        updatedAt: new Date(),
      })
      .where(eq(coupon.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(coupon)
      .where(eq(coupon.id, id))
      .returning({ id: coupon.id });

    return deleted.length > 0;
  },
};
