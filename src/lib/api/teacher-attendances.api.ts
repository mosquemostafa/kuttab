import { request, requestWithMeta } from "@/lib/api/api-core";
import type {
  BulkAttendanceActionDTO,
  DailyAttendanceQueryDTO,
  ListTeacherAttendancesQueryDTO,
  ToggleTeacherAttendanceDTO,
  UpdateTeacherAttendanceDTO,
} from "@/server/modules/teacher-attendances/teacher-attendance.dto";
import type {
  TeacherAttendanceDTO,
  TeacherDailyAttendanceDTO,
} from "@/shared/types/teacher-attendance.types";

export interface ToggleAttendanceResult {
  attended: boolean;
  attendance: TeacherAttendanceDTO | null;
}

export interface BulkAttendanceActionResult {
  affectedCount: number;
}

export const teacherAttendancesApi = {
  list: (query?: ListTeacherAttendancesQueryDTO) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, value]) => value !== undefined && value !== "")
        .map(([key, value]) => [key, String(value)]),
    );

    return requestWithMeta<TeacherAttendanceDTO>(
      `/teacher-attendances${params.size ? `?${params.toString()}` : ""}`,
    );
  },

  getDaily: (query: DailyAttendanceQueryDTO) =>
    request<TeacherDailyAttendanceDTO[]>(
      `/teacher-attendances/daily?date=${encodeURIComponent(query.date)}`,
    ),

  getById: (id: string) =>
    request<TeacherAttendanceDTO>(`/teacher-attendances/${id}`),

  toggle: (data: ToggleTeacherAttendanceDTO) =>
    request<ToggleAttendanceResult>("/teacher-attendances/toggle", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  markAllAttended: (data: BulkAttendanceActionDTO) =>
    request<BulkAttendanceActionResult>(
      "/teacher-attendances/mark-all-attended",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  markAllAbsent: (data: BulkAttendanceActionDTO) =>
    request<BulkAttendanceActionResult>("/teacher-attendances/mark-all-absent", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateTeacherAttendanceDTO) =>
    request<TeacherAttendanceDTO>(`/teacher-attendances/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<null>(`/teacher-attendances/${id}`, {
      method: "DELETE",
    }),
};
