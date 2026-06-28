import type { AuthenticatedUser } from '../types/auth';

export interface GetCurrentUserResponseData {
  user: AuthenticatedUser;
}
