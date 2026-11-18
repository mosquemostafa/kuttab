import {
  ConflictException,
  NotFoundException,
} from "@/server/exceptions/exceptions";
import {
  buildSelectMeta,
  type ParsedSelectQuery,
} from "@/server/dto/select-query.dto";
import type {
  CreateStudentDTO,
  ListStudentsQueryDTO,
  UpdateStudentDTO,
} from "@/server/modules/students/student.dto";
import {
  studentRepository,
  type StudentRow,
} from "@/server/modules/students/student.repository";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import { StudentPaymentMethod } from "@/shared/enums/student-payment-method.enum";
import { StudentStatus } from "@/shared/enums/student-status.enum";
import type {
  PaginationMeta,
  PaginatedResponse,
} from "@/shared/types/pagination.types";
import type { SelectNameItem } from "@/shared/types/select.types";
import type { StudentDTO } from "@/shared/types/student.types";

function toDTO(row: StudentRow): StudentDTO {
  return {
    id: row.id,
    userId: row.userId,
    classId: row.classId,
    className: row.className,
    name: row.name,
    birthDate: row.birthDate,
    grade: row.grade,
    job: row.job,
    phone: row.phone,
    studiedTajweed: row.studiedTajweed,
    previouslyEnrolled: row.previouslyEnrolled,
    previousEnrolledPlace: row.previousEnrolledPlace,
    memorizedPartsCount: row.memorizedPartsCount,
    memorizationDetails: row.memorizationDetails,
    status: row.status as StudentStatus,
    paymentMethod: (row.paymentMethod as StudentPaymentMethod) ?? null,
    registrationDate: row.registrationDate,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueUserViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("students_user_id_unique") ||
      error.message.includes("duplicate key"))
  );
}

export const studentService = {
  async listStudents(
    filters: Partial<ListStudentsQueryDTO>,
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<StudentDTO>> {
    const { items, total } = await studentRepository.findMany(
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

  async getStudentById(id: string): Promise<StudentDTO> {
    const found = await studentRepository.findById(id);
    if (!found) {
      throw new NotFoundException("Student", id);
    }

    return toDTO(found);
  },

  async createStudent(dto: CreateStudentDTO): Promise<StudentDTO> {
    if (dto.userId) {
      const existing = await studentRepository.findByUserId(dto.userId);
      if (existing.length > 0) {
        throw new ConflictException(
          "This user is already assigned to a student",
        );
      }
    }

    try {
      const created = await studentRepository.create({
        userId: dto.userId,
        classId: dto.classId,
        name: dto.name,
        birthDate: dto.birthDate,
        grade: dto.grade,
        job: dto.job,
        phone: dto.phone,
        studiedTajweed: dto.studiedTajweed,
        previouslyEnrolled: dto.previouslyEnrolled,
        previousEnrolledPlace: dto.previousEnrolledPlace,
        memorizedPartsCount: dto.memorizedPartsCount,
        memorizationDetails: dto.memorizationDetails,
        status: dto.status,
        paymentMethod: dto.paymentMethod,
        registrationDate: dto.registrationDate,
        notes: dto.notes,
      });

      return toDTO(created);
    } catch (error) {
      if (isUniqueUserViolation(error)) {
        throw new ConflictException(
          "This user is already assigned to a student",
        );
      }
      throw error;
    }
  },

  async updateStudent(id: string, dto: UpdateStudentDTO): Promise<StudentDTO> {
    if (dto.userId) {
      const existing = await studentRepository.findByUserId(dto.userId);
      if (existing.some((student) => student.id !== id)) {
        throw new ConflictException(
          "This user is already assigned to a student",
        );
      }
    }

    try {
      const updated = await studentRepository.update(id, dto);
      if (!updated) {
        throw new NotFoundException("Student", id);
      }

      return toDTO(updated);
    } catch (error) {
      if (isUniqueUserViolation(error)) {
        throw new ConflictException(
          "This user is already assigned to a student",
        );
      }
      throw error;
    }
  },

  async deleteStudent(id: string): Promise<void> {
    const deleted = await studentRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException("Student", id);
    }
  },

  async getSelectOptions(
    query: ParsedSelectQuery,
  ): Promise<{ items: SelectNameItem[]; meta: PaginationMeta }> {
    const { items, total } = await studentRepository.findSelectOptions(
      { q: query.q, includeArchived: query.includeArchived },
      { limit: query.limit, offset: query.offset },
    );

    return {
      items,
      meta: buildSelectMeta(total, query.page, query.limit),
    };
  },
};
