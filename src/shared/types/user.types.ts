import { UserRole } from "@/shared/enums/user-role.enum";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  emailVerified: boolean;
  role: UserRole;
  segmentId: string | null;
  segment: {
    id: string;
    name: string;
    icon: string;
  } | null;
  banned: boolean;
  banReason?: string | null;
  banExpires?: string | null;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithDetailsDTO extends UserDTO {
  accounts: string[];
  lastSignIn: string | null;
  avatarUrl: string | null;
}
