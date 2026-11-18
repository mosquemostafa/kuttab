import { createId } from "@paralleldrive/cuid2";
import { and, asc, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";

import { db } from "@/server/db";
import type { ListStudentSubscriptionsQueryDTO } from "@/server/modules/student-subscriptions/student-subscription.dto";
import { studentSubscription } from "@/server/modules/student-subscriptions/student-subscription.entity";
import { student } from "@/server/modules/students/student.entity";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import type { StudentSubscriptionType } from "@/shared/enums/student-subscription-type.enum";

export type StudentSubscriptionRow = {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  type: typeof studentSubscription.$inferSelect["type"];
  createdAt: Date;
  updatedAt: Date;
};

function subscriptionSelection() {
  return {
    id: studentSubscription.id,
    studentId: studentSubscription.studentId,
    studentName: student.name,
    amount: studentSubscription.amount,
    date: studentSubscription.date,
    type: studentSubscription.type,
    createdAt: studentSubscription.createdAt,
    updatedAt: studentSubscription.updatedAt,
  };
}

export type CreateStudentSubscriptionInput = {
  studentId: string;
  amount: number;
  date: string;
  type: StudentSubscriptionType;
};

export type UpdateStudentSubscriptionInput =
  Partial<CreateStudentSubscriptionInput>;

function toWhereClause(
  filters: Partial<ListStudentSubscriptionsQueryDTO>,
): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.studentId) {
    clauses.push(eq(studentSubscription.studentId, filters.studentId));
  }

  if (filters.type) {
    clauses.push(eq(studentSubscription.type, filters.type));
  }

  if (filters.date) {
    clauses.push(eq(studentSubscription.date, filters.date));
  }

  if (filters.startDate) {
    clauses.push(gte(studentSubscription.date, filters.startDate));
  }

  if (filters.endDate) {
    clauses.push(lte(studentSubscription.date, filters.endDate));
  }

  if (filters.minAmount !== undefined) {
    clauses.push(gte(studentSubscription.amount, filters.minAmount));
  }

  if (filters.maxAmount !== undefined) {
    clauses.push(lte(studentSubscription.amount, filters.maxAmount));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export const studentSubscriptionRepository = {
  async findMany(
    filters: Partial<ListStudentSubscriptionsQueryDTO>,
    pagination: ParsedPagination,
  ): Promise<{ items: StudentSubscriptionRow[]; total: number }> {
    const where = toWhereClause(filters);
    const isAsc = filters.sortOrder === "asc";

    let orderColumn = desc(studentSubscription.date);
    if (filters.sortBy === "amount") {
      orderColumn = isAsc
        ? asc(studentSubscription.amount)
        : desc(studentSubscription.amount);
    } else if (filters.sortBy === "createdAt") {
      orderColumn = isAsc
        ? asc(studentSubscription.createdAt)
        : desc(studentSubscription.createdAt);
    } else if (filters.sortBy === "date") {
      orderColumn = isAsc
        ? asc(studentSubscription.date)
        : desc(studentSubscription.date);
    }

    const [items, totalRows] = await Promise.all([
      db
        .select(subscriptionSelection())
        .from(studentSubscription)
        .innerJoin(student, eq(studentSubscription.studentId, student.id))
        .where(where)
        .orderBy(orderColumn, desc(studentSubscription.createdAt))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(studentSubscription).where(where),
    ]);

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  },

  async findById(id: string): Promise<StudentSubscriptionRow | null> {
    const [found] = await db
      .select(subscriptionSelection())
      .from(studentSubscription)
      .innerJoin(student, eq(studentSubscription.studentId, student.id))
      .where(eq(studentSubscription.id, id))
      .limit(1);

    return found ?? null;
  },

  async create(
    data: CreateStudentSubscriptionInput,
  ): Promise<StudentSubscriptionRow> {
    const [created] = await db
      .insert(studentSubscription)
      .values({ id: createId(), ...data })
      .returning({ id: studentSubscription.id });

    if (!created) throw new Error("Failed to create student subscription");
    const found = await this.findById(created.id);
    if (!found) throw new Error("Failed to load student subscription");
    return found;
  },

  async update(
    id: string,
    data: UpdateStudentSubscriptionInput,
  ): Promise<StudentSubscriptionRow | null> {
    const [updated] = await db
      .update(studentSubscription)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(studentSubscription.id, id))
      .returning({ id: studentSubscription.id });

    return updated ? this.findById(updated.id) : null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(studentSubscription)
      .where(eq(studentSubscription.id, id))
      .returning({ id: studentSubscription.id });

    return deleted.length > 0;
  },
};
