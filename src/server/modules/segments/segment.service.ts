import type {
  CreateSegmentDTO,
  UpdateSegmentDTO,
} from "@/server/modules/segments/segment.dto";
import { segmentRepository } from "@/server/modules/segments/segment.repository";
import type { ParsedPagination } from "@/server/pipes/parse-pagination.pipe";
import {
  ConflictException,
  NotFoundException,
} from "@/server/exceptions/exceptions";
import type { PaginatedResponse } from "@/shared/types/pagination.types";
import type { SegmentDTO } from "@/shared/types/segment.types";

type SegmentRow =
  Awaited<ReturnType<typeof segmentRepository.findById>> extends infer T
    ? NonNullable<T>
    : never;

function toDTO(item: SegmentRow): SegmentDTO {
  return {
    id: item.id,
    name: item.name,
    icon: item.icon,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("segment_name_unique") ||
    error.message.includes("duplicate key")
  );
}

export const segmentService = {
  async listSegments(
    pagination: ParsedPagination,
    searchQuery?: string,
    sortDirection: "asc" | "desc" = "desc",
  ): Promise<PaginatedResponse<SegmentDTO>> {
    const result = await segmentRepository.findMany(
      pagination,
      searchQuery,
      sortDirection,
    );

    return {
      items: result.items.map(toDTO),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit),
      },
    };
  },

  async getSegmentById(id: string): Promise<SegmentDTO> {
    const result = await segmentRepository.findById(id);

    if (!result) {
      throw new NotFoundException("Segment", id);
    }

    return toDTO(result);
  },

  async createSegment(input: CreateSegmentDTO): Promise<SegmentDTO> {
    try {
      const created = await segmentRepository.create({
        name: input.name,
        icon: input.icon,
      });

      return toDTO(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException("A segment with this name already exists");
      }

      throw error;
    }
  },

  async updateSegment(
    id: string,
    input: UpdateSegmentDTO,
  ): Promise<SegmentDTO> {
    try {
      const updated = await segmentRepository.update(id, {
        name: input.name,
        icon: input.icon,
      });

      if (!updated) {
        throw new NotFoundException("Segment", id);
      }

      return toDTO(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException("A segment with this name already exists");
      }

      throw error;
    }
  },

  async deleteSegment(id: string): Promise<void> {
    const deleted = await segmentRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException("Segment", id);
    }
  },
};
