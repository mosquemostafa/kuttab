import { NotFoundException } from "@/server/exceptions/exceptions";
import type {
  CreateStudentSubscriptionDTO,
  ListStudentSubscriptionsQueryDTO,
  UpdateStudentSubscriptionDTO,
} from "@/server/modules/student-subscriptions/student-subscription.dto";
import {
  studentSubscriptionRepository,
  type StudentSubscriptionRow,
} from "@/server/modules/student-subscriptions/student-subscription.repository";
import { studentRepository } from "@/server/modules/students/student.repository";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import { StudentSubscriptionType } from "@/shared/enums/student-subscription-type.enum";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type { StudentSubscriptionDTO } from "@/shared/types/student-subscription.types";

function toDTO(row: StudentSubscriptionRow): StudentSubscriptionDTO {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    amount: row.amount,
    date: row.date,
    type: row.type as StudentSubscriptionType,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ensureStudentExists(studentId: string): Promise<void> {
  const found = await studentRepository.findById(studentId);
  if (!found) {
    throw new NotFoundException("Student", studentId);
  }
}

export const studentSubscriptionService = {
  async listStudentSubscriptions(
    filters: Partial<ListStudentSubscriptionsQueryDTO>,
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<StudentSubscriptionDTO>> {
    const { items, total } = await studentSubscriptionRepository.findMany(
      filters,
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

  async getStudentSubscriptionById(
    id: string,
  ): Promise<StudentSubscriptionDTO> {
    const found = await studentSubscriptionRepository.findById(id);
    if (!found) {
      throw new NotFoundException("Student subscription", id);
    }

    return toDTO(found);
  },

  async createStudentSubscription(
    dto: CreateStudentSubscriptionDTO,
  ): Promise<StudentSubscriptionDTO> {
    await ensureStudentExists(dto.studentId);
    const created = await studentSubscriptionRepository.create(dto);
    return toDTO(created);
  },

  async updateStudentSubscription(
    id: string,
    dto: UpdateStudentSubscriptionDTO,
  ): Promise<StudentSubscriptionDTO> {
    if (dto.studentId) {
      await ensureStudentExists(dto.studentId);
    }

    const updated = await studentSubscriptionRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException("Student subscription", id);
    }

    return toDTO(updated);
  },

  async deleteStudentSubscription(id: string): Promise<void> {
    const deleted = await studentSubscriptionRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException("Student subscription", id);
    }
  },
};
