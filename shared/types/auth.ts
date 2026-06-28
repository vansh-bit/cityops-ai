import type { ROLE_PERMISSIONS, USER_ROLES } from '../constants/auth';

export type UserRole = (typeof USER_ROLES)[number];

export type Permission = (typeof ROLE_PERMISSIONS)[UserRole][number];

export interface AuthenticatedUser {
  uid: string;
  role: UserRole;
  permissions: Permission[];
  email?: string;
  displayName?: string;
}
