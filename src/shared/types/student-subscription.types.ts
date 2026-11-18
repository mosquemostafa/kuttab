import type { StudentSubscriptionType } from "@/shared/enums/student-subscription-type.enum";

export interface StudentSubscriptionDTO {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  type: StudentSubscriptionType;
  createdAt: string;
  updatedAt: string;
}
