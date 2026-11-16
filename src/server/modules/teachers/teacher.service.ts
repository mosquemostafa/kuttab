import { NotFoundException } from "@/server/exceptions/exceptions";
import {
  buildSelectMeta,
  type ParsedSelectQuery,
} from "@/server/dto/select-query.dto";
import type {
  CreateTeacherDTO,
  ListTeachersQueryDTO,
  UpdateTeacherDTO,
} from "@/server/modules/teachers/teacher.dto";
import {
  teacherRepository,
  type TeacherRow,
} from "@/server/modules/teachers/teacher.repository";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import { TeacherStatus } from "@/shared/enums/teacher-status.enum";
import { TeacherStudentType } from "@/shared/enums/teacher-student-type.enum";
import type {
  PaginationMeta,
  PaginatedResponse,
} from "@/shared/types/pagination.types";
import type { SelectNameItem } from "@/shared/types/select.types";
import type { TeacherDTO } from "@/shared/types/teacher.types";

function toDTO(row: TeacherRow): TeacherDTO {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    phone: row.phone,
    studentType: (row.studentType as TeacherStudentType) ?? null,
    status: row.status as TeacherStatus,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const teacherService = {
  async listTeachers(
    filters: Partial<ListTeachersQueryDTO>,
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<TeacherDTO>> {
    const { items, total } = await teacherRepository.findMany(
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

  async getTeacherById(id: string): Promise<TeacherDTO> {
    const found = await teacherRepository.findById(id);
    if (!found) {
      throw new NotFoundException("Teacher", id);
    }

    return toDTO(found);
  },

  async createTeacher(dto: CreateTeacherDTO): Promise<TeacherDTO> {
    const created = await teacherRepository.create({
      userId: dto.userId,
      name: dto.name,
      phone: dto.phone,
      studentType: dto.studentType,
      status: dto.status,
      notes: dto.notes,
    });

    return toDTO(created);
  },

  async updateTeacher(id: string, dto: UpdateTeacherDTO): Promise<TeacherDTO> {
    const updated = await teacherRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException("Teacher", id);
    }

    return toDTO(updated);
  },

  async deleteTeacher(id: string): Promise<void> {
    const deleted = await teacherRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException("Teacher", id);
    }
  },

  async getSelectOptions(
    query: ParsedSelectQuery,
  ): Promise<{ items: SelectNameItem[]; meta: PaginationMeta }> {
    const { items, total } = await teacherRepository.findSelectOptions(
      { q: query.q, includeArchived: query.includeArchived },
      { limit: query.limit, offset: query.offset },
    );

    return {
      items,
      meta: buildSelectMeta(total, query.page, query.limit),
    };
  },
};
