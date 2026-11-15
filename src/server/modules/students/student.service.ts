import { NotFoundException } from "@/server/exceptions/exceptions";
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
import { StudentStatus } from "@/shared/enums/student-status.enum";
import type { PaginationMeta, PaginatedResponse } from "@/shared/types/pagination.types";
import type { SelectNameItem } from "@/shared/types/select.types";
import type { StudentDTO } from "@/shared/types/student.types";

function toDTO(row: StudentRow): StudentDTO {
  return {
    id: row.id,
    userId: row.userId,
    classId: row.classId,
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
    registrationDate: row.registrationDate,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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
      registrationDate: dto.registrationDate,
      notes: dto.notes,
    });

    return toDTO(created);
  },

  async updateStudent(
    id: string,
    dto: UpdateStudentDTO,
  ): Promise<StudentDTO> {
    const updated = await studentRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException("Student", id);
    }

    return toDTO(updated);
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
