import { NotFoundException } from "@/server/exceptions/exceptions";
import {
  buildSelectMeta,
  type ParsedSelectQuery,
} from "@/server/dto/select-query.dto";
import type {
  CreateClassDTO,
  ListClassesQueryDTO,
  UpdateClassDTO,
} from "@/server/modules/classes/class.dto";
import {
  classRepository,
  type ClassRow,
} from "@/server/modules/classes/class.repository";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import { ClassType } from "@/shared/enums/class-type.enum";
import type {
  PaginationMeta,
  PaginatedResponse,
} from "@/shared/types/pagination.types";
import type { SelectNameItem } from "@/shared/types/select.types";
import type { ClassDTO } from "@/shared/types/class.types";

function toDTO(row: ClassRow): ClassDTO {
  return {
    id: row.id,
    name: row.name,
    primaryTeacherId: row.primaryTeacherId,
    secondaryTeacherId: row.secondaryTeacherId,
    classType: row.classType as ClassType,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const classService = {
  async listClasses(
    filters: Partial<ListClassesQueryDTO>,
    pagination: ParsedPagination,
  ): Promise<PaginatedResponse<ClassDTO>> {
    const { items, total } = await classRepository.findMany(
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

  async getClassById(id: string): Promise<ClassDTO> {
    const found = await classRepository.findById(id);
    if (!found) {
      throw new NotFoundException("Class", id);
    }

    return toDTO(found);
  },

  async createClass(dto: CreateClassDTO): Promise<ClassDTO> {
    const created = await classRepository.create({
      name: dto.name,
      primaryTeacherId: dto.primaryTeacherId,
      secondaryTeacherId: dto.secondaryTeacherId,
      classType: dto.classType,
    });

    return toDTO(created);
  },

  async updateClass(id: string, dto: UpdateClassDTO): Promise<ClassDTO> {
    const updated = await classRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException("Class", id);
    }

    return toDTO(updated);
  },

  async deleteClass(id: string): Promise<void> {
    const deleted = await classRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException("Class", id);
    }
  },

  async getSelectOptions(
    query: ParsedSelectQuery,
  ): Promise<{ items: SelectNameItem[]; meta: PaginationMeta }> {
    const { items, total } = await classRepository.findSelectOptions(
      { q: query.q },
      { limit: query.limit, offset: query.offset },
    );

    return {
      items,
      meta: buildSelectMeta(total, query.page, query.limit),
    };
  },
};
