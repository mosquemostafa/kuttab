export const AttendanceDeductionType = {
  FROM_35_TO_45_MIN: "from_35_to_45_min",
  FROM_45_TO_60_MIN: "from_45_to_60_min",
  MORE_THAN_60_MIN: "more_than_60_min",
  EXCUSED_ABSENCE: "excused_absence",
} as const;

export type AttendanceDeductionType =
  (typeof AttendanceDeductionType)[keyof typeof AttendanceDeductionType];

export type DeductionDays = Record<AttendanceDeductionType, number>;

export interface TeacherAttendanceDTO {
  id: string;
  teacherId: string;
  attendanceDate: string; // YYYY-MM-DD
  attendanceDeductionType: AttendanceDeductionType | null;
  recordedBy: string;
  createdAt: string; // ISO string
}

export interface TeacherDailyAttendanceDTO {
  teacherId: string;
  teacherName: string;
  isAttended: boolean;
  attendance: TeacherAttendanceDTO | null;
}

export interface TeacherWeeklyAttendanceDayDTO {
  date: string; // YYYY-MM-DD
  isAttended: boolean;
  attendance: TeacherAttendanceDTO | null;
}

export interface TeacherWeeklyAttendanceDTO {
  teacherId: string;
  teacherName: string;
  days: TeacherWeeklyAttendanceDayDTO[];
}

export interface TeacherSalaryReportItemDTO {
  teacherId: string;
  teacherName: string;
  monthlySalary: number | null;
  expectedWorkingDays: number;
  attendedDays: number;
  absentDays: number;
  deductionTypeOccurrences: number;
  deductionDays: number;
  totalDeductionDays: number;
  dailyRate: number | null;
  absenceDeductionAmount: number | null;
  deductionAmount: number | null;
  totalDeductionAmount: number | null;
  netSalary: number | null;
}

export interface TeacherSalaryReportSummaryDTO {
  teacherCount: number;
  missingSalaryCount: number;
  totalMonthlySalaries: number;
  totalDeductions: number;
  totalNetSalaries: number;
}

export interface TeacherMonthlySalaryReportDTO {
  month: string; // YYYY-MM
  startDate: string;
  endDate: string;
  workingDays: number[];
  workingDates: string[];
  deductionDays: DeductionDays;
  teachers: TeacherSalaryReportItemDTO[];
  summary: TeacherSalaryReportSummaryDTO;
}
