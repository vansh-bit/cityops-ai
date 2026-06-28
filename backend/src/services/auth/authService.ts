import type { DecodedIdToken } from 'firebase-admin/auth';
import { ROLE_PERMISSIONS, USER_ROLES, type AuthenticatedUser, type UserRole } from 'cityops-ai-shared';
import { getAuth } from '../../config/firebase';
import { HttpError } from '../../errors/HttpError';
import type { AuthService } from './types';

const USER_ROLE_SET = new Set<string>(USER_ROLES);

function resolveRole(decodedToken: DecodedIdToken): UserRole {
  const claimedRole = decodedToken.role;

  if (typeof claimedRole === 'string') {
    if (!USER_ROLE_SET.has(claimedRole)) {
      throw new HttpError(403, 'AUTH_ROLE_INVALID', 'Authenticated user role is not supported.');
    }

    return claimedRole as UserRole;
  }

  return 'citizen';
}

function mapDecodedTokenToUser(decodedToken: DecodedIdToken): AuthenticatedUser {
  const role = resolveRole(decodedToken);

  return {
    uid: decodedToken.uid,
    role,
    permissions: [...ROLE_PERMISSIONS[role]],
    email: decodedToken.email,
    displayName: decodedToken.name,
  };
}

export class FirebaseAuthService implements AuthService {
  async verifyIdToken(token: string): Promise<AuthenticatedUser> {
    try {
      const decodedToken = await getAuth().verifyIdToken(token, true);
      return mapDecodedTokenToUser(decodedToken);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Authentication failed.';
      const code =
        typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;

      if (code === 'auth/id-token-expired') {
        throw new HttpError(401, 'AUTH_TOKEN_EXPIRED', 'Authentication token has expired.');
      }

      if (code === 'auth/argument-error') {
        throw new HttpError(401, 'AUTH_TOKEN_INVALID', 'Authentication token is malformed.');
      }

      throw new HttpError(401, 'AUTH_TOKEN_INVALID', message);
    }
  }
}

export { mapDecodedTokenToUser, resolveRole };
