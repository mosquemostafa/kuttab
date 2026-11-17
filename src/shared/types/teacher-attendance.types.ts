export const LatenessPeriod = {
  FROM_35_TO_45_MIN: "from_35_to_45_min",
  FROM_45_TO_60_MIN: "from_45_to_60_min",
  MORE_THAN_60_MIN: "more_than_60_min",
} as const;

export type LatenessPeriod =
  (typeof LatenessPeriod)[keyof typeof LatenessPeriod];

export type LatenessDeductionDays = Record<LatenessPeriod, number>;

export interface TeacherAttendanceDTO {
  id: string;
  teacherId: string;
  attendanceDate: string; // YYYY-MM-DD
  latenessPeriod: LatenessPeriod | null;
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
