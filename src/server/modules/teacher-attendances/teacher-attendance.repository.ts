import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";

import { db } from "@/server/db";
import { teacherAttendance } from "@/server/modules/teacher-attendances/teacher-attendance.entity";
import { teacher } from "@/server/modules/teachers/teacher.entity";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import type { LatenessPeriod } from "@/shared/types/teacher-attendance.types";

export type TeacherAttendanceRow = typeof teacherAttendance.$inferSelect;

export interface AttendanceFilters {
  teacherId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  latenessPeriod?: LatenessPeriod;
}

function toWhereClause(filters: AttendanceFilters) {
  const clauses: SQL[] = [];

  if (filters.teacherId) {
    clauses.push(eq(teacherAttendance.teacherId, filters.teacherId));
  }
  if (filters.date) {
    clauses.push(eq(teacherAttendance.attendanceDate, filters.date));
  }
  if (filters.startDate) {
    clauses.push(gte(teacherAttendance.attendanceDate, filters.startDate));
  }
  if (filters.endDate) {
    clauses.push(lte(teacherAttendance.attendanceDate, filters.endDate));
  }
  if (filters.latenessPeriod) {
    clauses.push(eq(teacherAttendance.latenessPeriod, filters.latenessPeriod));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export const teacherAttendanceRepository = {
  async findMany(
    filters: AttendanceFilters,
    pagination: ParsedPagination,
  ): Promise<{ items: TeacherAttendanceRow[]; total: number }> {
    const where = toWhereClause(filters);

    const [items, totalRows] = await Promise.all([
      db
        .select()
        .from(teacherAttendance)
        .where(where)
        .orderBy(
          desc(teacherAttendance.attendanceDate),
          desc(teacherAttendance.createdAt),
        )
        .limit(pagination.limit)
        .offset(pagination.offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(teacherAttendance)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.count ?? 0),
    };
  },

  async findById(id: string): Promise<TeacherAttendanceRow | null> {
    const [found] = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.id, id))
      .limit(1);

    return found ?? null;
  },

  async findByTeacherAndDate(
    teacherId: string,
    attendanceDate: string,
  ): Promise<TeacherAttendanceRow | null> {
    const [found] = await db
      .select()
      .from(teacherAttendance)
      .where(
        and(
          eq(teacherAttendance.teacherId, teacherId),
          eq(teacherAttendance.attendanceDate, attendanceDate),
        ),
      )
      .limit(1);

    return found ?? null;
  },

  async findDailyWithTeachers(attendanceDate: string) {
    // Get all active teachers (only id and name)
    const teachers = await db
      .select({
        id: teacher.id,
        name: teacher.name,
      })
      .from(teacher)
      .where(eq(teacher.status, "active"))
      .orderBy(teacher.name);

    // Get attendance records for this date
    const attendances = await db
      .select()
      .from(teacherAttendance)
      .where(eq(teacherAttendance.attendanceDate, attendanceDate));

    const attendanceMap = new Map<string, TeacherAttendanceRow>();
    for (const record of attendances) {
      attendanceMap.set(record.teacherId, record);
    }

    return teachers.map((t) => ({
      teacherId: t.id,
      teacherName: t.name,
      attendance: attendanceMap.get(t.id) ?? null,
    }));
  },

  async create(data: {
    teacherId: string;
    attendanceDate: string;
    latenessPeriod?: LatenessPeriod | null;
    recordedBy: string;
  }): Promise<TeacherAttendanceRow> {
    const [created] = await db
      .insert(teacherAttendance)
      .values({
        teacherId: data.teacherId,
        attendanceDate: data.attendanceDate,
        latenessPeriod: data.latenessPeriod ?? null,
        recordedBy: data.recordedBy,
      })
      .returning();

    return created;
  },

  async update(
    id: string,
    data: {
      latenessPeriod?: LatenessPeriod | null;
    },
  ): Promise<TeacherAttendanceRow | null> {
    const [updated] = await db
      .update(teacherAttendance)
      .set(data)
      .where(eq(teacherAttendance.id, id))
      .returning();

    return updated ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(teacherAttendance)
      .where(eq(teacherAttendance.id, id))
      .returning({ id: teacherAttendance.id });

    return deleted.length > 0;
  },

  async toggleAttendance(params: {
    teacherId: string;
    attendanceDate: string;
    recordedBy: string;
    latenessPeriod?: LatenessPeriod | null;
  }): Promise<{ attended: boolean; attendance: TeacherAttendanceRow | null }> {
    return await db.transaction(async (tx) => {
      // Find existing record
      const [existing] = await tx
        .select()
        .from(teacherAttendance)
        .where(
          and(
            eq(teacherAttendance.teacherId, params.teacherId),
            eq(teacherAttendance.attendanceDate, params.attendanceDate),
          ),
        )
        .limit(1);

      if (existing) {
        // Exists: remove attendance
        await tx
          .delete(teacherAttendance)
          .where(eq(teacherAttendance.id, existing.id));

        return {
          attended: false,
          attendance: null,
        };
      } else {
        // Does not exist: mark attendance
        const [created] = await tx
          .insert(teacherAttendance)
          .values({
            teacherId: params.teacherId,
            attendanceDate: params.attendanceDate,
            latenessPeriod: params.latenessPeriod ?? null,
            recordedBy: params.recordedBy,
          })
          .returning();

        return {
          attended: true,
          attendance: created,
        };
      }
    });
  },

  async markAllAttended(params: {
    attendanceDate: string;
    recordedBy: string;
  }): Promise<{ affectedCount: number }> {
    return await db.transaction(async (tx) => {
      // 1. Get all active teachers
      const activeTeachers = await tx
        .select({ id: teacher.id })
        .from(teacher)
        .where(eq(teacher.status, "active"));

      if (activeTeachers.length === 0) {
        return { affectedCount: 0 };
      }

      // 2. Insert records using ON CONFLICT DO NOTHING on unique (teacher_id, attendance_date)
      const valuesToInsert = activeTeachers.map((t) => ({
        teacherId: t.id,
        attendanceDate: params.attendanceDate,
        recordedBy: params.recordedBy,
      }));

      const inserted = await tx
        .insert(teacherAttendance)
        .values(valuesToInsert)
        .onConflictDoNothing({
          target: [teacherAttendance.teacherId, teacherAttendance.attendanceDate],
        })
        .returning({ id: teacherAttendance.id });

      return { affectedCount: inserted.length };
    });
  },

  async markAllAbsent(attendanceDate: string): Promise<{ affectedCount: number }> {
    // Deleting all attendance records for the date marks all teachers absent
    const deleted = await db
      .delete(teacherAttendance)
      .where(eq(teacherAttendance.attendanceDate, attendanceDate))
      .returning({ id: teacherAttendance.id });

    return { affectedCount: deleted.length };
  },
};
