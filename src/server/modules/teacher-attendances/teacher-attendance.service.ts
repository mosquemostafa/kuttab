import { NotFoundException } from "@/server/exceptions/exceptions";
import { appSettingsService } from "@/server/modules/app-settings/app-settings.service";
import type {
  DailyAttendanceQueryDTO,
  ListTeacherAttendancesQueryDTO,
  SalaryReportQueryDTO,
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
  TeacherMonthlySalaryReportDTO,
  TeacherSalaryReportItemDTO,
  TeacherWeeklyAttendanceDTO,
} from "@/shared/types/teacher-attendance.types";

const WEEK_LENGTH_DAYS = 7;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getMonthRange(month: string): { startDate: string; endDate: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function getWorkingDates(
  startDate: string,
  endDate: string,
  workingDays: number[],
): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const workingDaySet = new Set(workingDays);

  while (current <= end) {
    if (workingDaySet.has(current.getUTCDay())) {
      dates.push(current.toISOString().slice(0, 10));
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
}

function calculateSalaryItem(
  row: Awaited<
    ReturnType<typeof teacherAttendanceRepository.findSalaryReportRows>
  >[number],
  workingDateSet: Set<string>,
  expectedWorkingDays: number,
  latenessDeductions: Record<LatenessPeriod, number>,
): TeacherSalaryReportItemDTO {
  const activeDayAttendances = row.attendances.filter((attendance) =>
    workingDateSet.has(attendance.attendanceDate),
  );
  const attendedDays = activeDayAttendances.length;
  const absentDays = Math.max(expectedWorkingDays - attendedDays, 0);
  const lateAttendances = activeDayAttendances.filter(
    (attendance) => attendance.latenessPeriod !== null,
  );
  const latenessDeductionDays = lateAttendances.reduce((total, attendance) => {
    const period = attendance.latenessPeriod as LatenessPeriod;
    return total + (latenessDeductions[period] ?? 0);
  }, 0);
  const totalDeductionDays = absentDays + latenessDeductionDays;

  if (row.monthlySalary === null) {
    return {
      teacherId: row.teacherId,
      teacherName: row.teacherName,
      monthlySalary: null,
      expectedWorkingDays,
      attendedDays,
      absentDays,
      latenessOccurrences: lateAttendances.length,
      latenessDeductionDays,
      totalDeductionDays,
      dailyRate: null,
      absenceDeductionAmount: null,
      latenessDeductionAmount: null,
      totalDeductionAmount: null,
      netSalary: null,
    };
  }

  const dailyRate =
    expectedWorkingDays > 0 ? row.monthlySalary / expectedWorkingDays : 0;
  const absenceDeductionAmount = dailyRate * absentDays;
  const latenessDeductionAmount = dailyRate * latenessDeductionDays;
  const totalDeductionAmount = Math.min(
    row.monthlySalary,
    absenceDeductionAmount + latenessDeductionAmount,
  );

  return {
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    monthlySalary: row.monthlySalary,
    expectedWorkingDays,
    attendedDays,
    absentDays,
    latenessOccurrences: lateAttendances.length,
    latenessDeductionDays,
    totalDeductionDays,
    dailyRate: roundMoney(dailyRate),
    absenceDeductionAmount: roundMoney(absenceDeductionAmount),
    latenessDeductionAmount: roundMoney(latenessDeductionAmount),
    totalDeductionAmount: roundMoney(totalDeductionAmount),
    netSalary: roundMoney(row.monthlySalary - totalDeductionAmount),
  };
}

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

  async getMonthlySalaryReport(
    query: SalaryReportQueryDTO,
  ): Promise<TeacherMonthlySalaryReportDTO> {
    const { startDate, endDate } = getMonthRange(query.month);
    const settings = await appSettingsService.getSettings();
    const workingDates = getWorkingDates(
      startDate,
      endDate,
      settings.workingDays,
    );
    const workingDateSet = new Set(workingDates);
    const rows = await teacherAttendanceRepository.findSalaryReportRows(
      startDate,
      endDate,
    );
    const teachers = rows.map((row) =>
      calculateSalaryItem(
        row,
        workingDateSet,
        workingDates.length,
        settings.latenessDeductionDays,
      ),
    );

    return {
      month: query.month,
      startDate,
      endDate,
      workingDays: settings.workingDays,
      workingDates,
      latenessDeductionDays: settings.latenessDeductionDays,
      teachers,
      summary: {
        teacherCount: teachers.length,
        missingSalaryCount: teachers.filter(
          (teacher) => teacher.monthlySalary === null,
        ).length,
        totalMonthlySalaries: roundMoney(
          teachers.reduce(
            (total, teacher) => total + (teacher.monthlySalary ?? 0),
            0,
          ),
        ),
        totalDeductions: roundMoney(
          teachers.reduce(
            (total, teacher) => total + (teacher.totalDeductionAmount ?? 0),
            0,
          ),
        ),
        totalNetSalaries: roundMoney(
          teachers.reduce(
            (total, teacher) => total + (teacher.netSalary ?? 0),
            0,
          ),
        ),
      },
    };
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
