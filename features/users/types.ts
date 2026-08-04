export const USER_ROLES = ["ADMIN", "PROJECT_MANAGER", "MEMBER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Pemilik / Admin",
  PROJECT_MANAGER: "Manajer Proyek",
  MEMBER: "Anggota Tim",
};

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  jobTitle: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
