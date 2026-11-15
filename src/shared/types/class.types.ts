import type { ClassType } from "@/shared/enums/class-type.enum";

export interface ClassDTO {
  id: string;
  name: string;
  primaryTeacherId: string | null;
  secondaryTeacherId: string | null;
  classType: ClassType;
  createdAt: string;
  updatedAt: string;
}
