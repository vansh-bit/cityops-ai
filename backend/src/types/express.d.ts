import type { AuthenticatedUser } from 'cityops-ai-shared';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
