import type { AuthenticatedUser } from 'cityops-ai-shared';

export interface AuthService {
  verifyIdToken(token: string): Promise<AuthenticatedUser>;
}
