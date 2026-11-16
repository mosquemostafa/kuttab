import type { StudentPaymentMethod } from "@/shared/enums/student-payment-method.enum";
import type { StudentStatus } from "@/shared/enums/student-status.enum";

export interface StudentDTO {
  id: string;
  userId: string | null;
  classId: string | null;
  name: string;
  birthDate: string | null;
  grade: string | null;
  job: string | null;
  phone: string | null;
  studiedTajweed: boolean;
  previouslyEnrolled: boolean;
  previousEnrolledPlace: string | null;
  memorizedPartsCount: number;
  memorizationDetails: string | null;
  status: StudentStatus;
  paymentMethod: StudentPaymentMethod | null;
  registrationDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
