import { NotFoundException } from "@/server/exceptions/exceptions";
import type {
  DailyAttendanceQueryDTO,
  ListTeacherAttendancesQueryDTO,
  ToggleTeacherAttendanceDTO,
  UpdateTeacherAttendanceDTO,
  WeeklyAttendanceQueryDTO,
} from "@/server/modules/teacher-attendances/teacher-attendance.dto";
import {
  teacherAttendanceRepository,
  type TeacherAttendanceRow,
} from "@/server/modules/teacher-attendances/teacher-attendance.repository";
import { teacherRepository } from "@/server/modules/teachers/teacher.repository";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type {
  LatenessPeriod,
  TeacherAttendanceDTO,
  TeacherDailyAttendanceDTO,
  TeacherWeeklyAttendanceDTO,
} from "@/shared/types/teacher-attendance.types";

const WEEK_LENGTH_DAYS = 7;

function addUtcDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function toDTO(row: TeacherAttendanceRow): TeacherAttendanceDTO {
  return {
    id: row.id,
    teacherId: row.teacherId,
    attendanceDate: row.attendanceDate,
    latenessPeriod: (row.latenessPeriod as LatenessPeriod) ?? null,
    recordedBy: row.recordedBy,
    createdAt: row.createdAt.toISOString(),
  };
}

export const teacherAttendanceService = {
  async listAttendances(
    filters: ListTeacherAttendancesQueryDTO,
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<TeacherAttendanceDTO>> {
    const { items, total } = await teacherAttendanceRepository.findMany(
      {
        teacherId: filters.teacherId,
        date: filters.date,
        startDate: filters.startDate,
        endDate: filters.endDate,
        latenessPeriod: filters.latenessPeriod,
      },
      pagination,
    );

    return {
      items: items.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  },

  async getAttendanceById(id: string): Promise<TeacherAttendanceDTO> {
    const found = await teacherAttendanceRepository.findById(id);
    if (!found) {
      throw new NotFoundException("Teacher Attendance", id);
    }
    return toDTO(found);
  },

  async getDailyAttendance(
    query: DailyAttendanceQueryDTO,
  ): Promise<TeacherDailyAttendanceDTO[]> {
    const records = await teacherAttendanceRepository.findDailyWithTeachers(
      query.date,
    );

    return records.map((record) => ({
      teacherId: record.teacherId,
      teacherName: record.teacherName,
      isAttended: record.attendance !== null,
      attendance: record.attendance ? toDTO(record.attendance) : null,
    }));
  },

  async getWeeklyAttendance(
    query: WeeklyAttendanceQueryDTO,
  ): Promise<TeacherWeeklyAttendanceDTO[]> {
    const dates = Array.from({ length: WEEK_LENGTH_DAYS }, (_, index) =>
      addUtcDays(query.startDate, index),
    );
    const endDate = dates[dates.length - 1];
    const records = await teacherAttendanceRepository.findWeeklyWithTeachers(
      query.startDate,
      endDate,
    );

    return records.map((record) => {
      const attendanceByDate = new Map(
        record.attendances.map((attendance) => [
          attendance.attendanceDate,
          attendance,
        ]),
      );

      return {
        teacherId: record.teacherId,
        teacherName: record.teacherName,
        days: dates.map((date) => {
          const attendance = attendanceByDate.get(date);
          return {
            date,
            isAttended: attendance !== undefined,
            attendance: attendance ? toDTO(attendance) : null,
          };
        }),
      };
    });
  },

  async toggleAttendance(
    recordedBy: string,
    dto: ToggleTeacherAttendanceDTO,
  ): Promise<{ attended: boolean; attendance: TeacherAttendanceDTO | null }> {
    // Validate teacher exists
    const existingTeacher = await teacherRepository.findById(dto.teacherId);
    if (!existingTeacher) {
      throw new NotFoundException("Teacher", dto.teacherId);
    }

    const result = await teacherAttendanceRepository.toggleAttendance({
      teacherId: dto.teacherId,
      attendanceDate: dto.attendanceDate,
      recordedBy,
      latenessPeriod: dto.latenessPeriod,
    });

    return {
      attended: result.attended,
      attendance: result.attendance ? toDTO(result.attendance) : null,
    };
  },

  async updateAttendance(
    id: string,
    dto: UpdateTeacherAttendanceDTO,
  ): Promise<TeacherAttendanceDTO> {
    const updated = await teacherAttendanceRepository.update(id, {
      latenessPeriod: dto.latenessPeriod,
    });

    if (!updated) {
      throw new NotFoundException("Teacher Attendance", id);
    }

    return toDTO(updated);
  },

  async deleteAttendance(id: string): Promise<void> {
    const deleted = await teacherAttendanceRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException("Teacher Attendance", id);
    }
  },

  async markAllAttended(
    recordedBy: string,
    date: string,
  ): Promise<{ affectedCount: number }> {
    return await teacherAttendanceRepository.markAllAttended({
      attendanceDate: date,
      recordedBy,
    });
  },

  async markAllAbsent(date: string): Promise<{ affectedCount: number }> {
    return await teacherAttendanceRepository.markAllAbsent(date);
  },
};
