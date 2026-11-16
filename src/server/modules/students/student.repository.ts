import { createId } from "@paralleldrive/cuid2";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  type SQL,
} from "drizzle-orm";

import { db } from "@/server/db";
import { student } from "@/server/modules/students/student.entity";
import type { ListStudentsQueryDTO } from "@/server/modules/students/student.dto";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";

export type StudentRow = typeof student.$inferSelect;

export type CreateStudentInput = {
  userId?: string | null;
  classId?: string | null;
  name: string;
  birthDate?: string | null;
  grade?: string | null;
  job?: string | null;
  phone?: string | null;
  studiedTajweed?: boolean;
  previouslyEnrolled?: boolean;
  previousEnrolledPlace?: string | null;
  memorizedPartsCount?: number;
  memorizationDetails?: string | null;
  status?: "active" | "archived" | "rejected" | "pending";
  paymentMethod?:
    | "exempt_poor"
    | "installments"
    | "exempt_staff_kids"
    | "special"
    | "monthly"
    | "yearly"
    | "sponsored"
    | null;
  registrationDate?: string;
  notes?: string | null;
};

export type UpdateStudentInput = Partial<CreateStudentInput>;

function toWhereClause(
  filters: Partial<ListStudentsQueryDTO>,
): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    clauses.push(
      or(
        ilike(student.name, pattern),
        ilike(student.phone, pattern),
        ilike(student.grade, pattern),
        ilike(student.job, pattern),
        ilike(student.notes, pattern),
      )!,
    );
  }

  if (filters.userId) {
    clauses.push(eq(student.userId, filters.userId));
  }

  if (filters.classId) {
    clauses.push(eq(student.classId, filters.classId));
  }

  if (filters.status) {
    clauses.push(eq(student.status, filters.status));
  }

  if (filters.paymentMethod) {
    clauses.push(eq(student.paymentMethod, filters.paymentMethod));
  }

  if (filters.studiedTajweed !== undefined) {
    clauses.push(eq(student.studiedTajweed, filters.studiedTajweed));
  }

  if (filters.previouslyEnrolled !== undefined) {
    clauses.push(eq(student.previouslyEnrolled, filters.previouslyEnrolled));
  }

  if (filters.minMemorizedParts !== undefined) {
    clauses.push(gte(student.memorizedPartsCount, filters.minMemorizedParts));
  }

  if (filters.maxMemorizedParts !== undefined) {
    clauses.push(lte(student.memorizedPartsCount, filters.maxMemorizedParts));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export const studentRepository = {
  async findMany(
    filters: Partial<ListStudentsQueryDTO>,
    pagination: ParsedPagination,
  ): Promise<{ items: StudentRow[]; total: number }> {
    const where = toWhereClause(filters);

    let orderColumn = desc(student.createdAt);
    const isAsc = filters.sortOrder === "asc";

    if (filters.sortBy === "name") {
      orderColumn = isAsc ? asc(student.name) : desc(student.name);
    } else if (filters.sortBy === "registrationDate") {
      orderColumn = isAsc
        ? asc(student.registrationDate)
        : desc(student.registrationDate);
    } else if (filters.sortBy === "memorizedPartsCount") {
      orderColumn = isAsc
        ? asc(student.memorizedPartsCount)
        : desc(student.memorizedPartsCount);
    } else if (filters.sortBy === "createdAt") {
      orderColumn = isAsc ? asc(student.createdAt) : desc(student.createdAt);
    }

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(student)
        .where(where)
        .orderBy(orderColumn)
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(student).where(where),
    ]);

    return {
      items,
      total: totalRows[0]?.count ?? 0,
    };
  },

  async findById(id: string): Promise<StudentRow | null> {
    const [found] = await db
      .select()
      .from(student)
      .where(eq(student.id, id))
      .limit(1);

    return found ?? null;
  },

  async findByUserId(userId: string): Promise<StudentRow[]> {
    return db
      .select()
      .from(student)
      .where(eq(student.userId, userId))
      .orderBy(desc(student.createdAt));
  },

  async findByClassId(classId: string): Promise<StudentRow[]> {
    return db
      .select()
      .from(student)
      .where(eq(student.classId, classId))
      .orderBy(desc(student.createdAt));
  },

  async create(data: CreateStudentInput): Promise<StudentRow> {
    const [created] = await db
      .insert(student)
      .values({
        id: createId(),
        userId: data.userId ?? null,
        classId: data.classId ?? null,
        name: data.name,
        birthDate: data.birthDate ?? null,
        grade: data.grade ?? null,
        job: data.job ?? null,
        phone: data.phone ?? null,
        studiedTajweed: data.studiedTajweed ?? false,
        previouslyEnrolled: data.previouslyEnrolled ?? false,
        previousEnrolledPlace: data.previousEnrolledPlace ?? null,
        memorizedPartsCount: data.memorizedPartsCount ?? 0,
        memorizationDetails: data.memorizationDetails ?? null,
        status: data.status ?? "active",
        paymentMethod: data.paymentMethod ?? null,
        registrationDate:
          data.registrationDate ?? new Date().toISOString().slice(0, 10),
        notes: data.notes ?? null,
      })
      .returning();

    return created;
  },

  async update(
    id: string,
    data: UpdateStudentInput,
  ): Promise<StudentRow | null> {
    const [updated] = await db
      .update(student)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(student.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(student)
      .where(eq(student.id, id))
      .returning({ id: student.id });

    return deleted.length > 0;
  },

  async findSelectOptions(
    filters: { q?: string; includeArchived?: boolean },
    pagination: { limit: number; offset: number },
  ): Promise<{ items: { id: string; name: string }[]; total: number }> {
    const clauses: SQL[] = [];

    if (!filters.includeArchived) {
      clauses.push(eq(student.status, "active"));
    }

    if (filters.q) {
      clauses.push(ilike(student.name, `%${filters.q}%`));
    }

    const whereClause = clauses.length > 0 ? and(...clauses) : undefined;

    const [items, [countResult]] = await Promise.all([
      db
        .select({
          id: student.id,
          name: student.name,
        })
        .from(student)
        .where(whereClause)
        .orderBy(asc(student.name))
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ count: count() }).from(student).where(whereClause),
    ]);

    return {
      items,
      total: countResult?.count ?? 0,
    };
  },
};
