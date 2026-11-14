import type { ColorKey } from "@/shared/constants/color-palette";

export interface ProjectDTO {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  /** Folder tint, or `null` for no tint. */
  colorKey: ColorKey | null;
  icon: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
