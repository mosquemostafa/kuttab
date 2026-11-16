import type { TeacherStatus } from "@/shared/enums/teacher-status.enum";
import type { TeacherStudentType } from "@/shared/enums/teacher-student-type.enum";

export interface TeacherDTO {
  id: string;
  userId: string | null;
  name: string;
  phone: string | null;
  studentType: TeacherStudentType | null;
  status: TeacherStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
