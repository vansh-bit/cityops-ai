import type { NextFunction, Request, Response } from 'express';
import type { Permission, UserRole } from 'cityops-ai-shared';
import { HttpError } from '../errors/HttpError';

function ensureAuthenticatedUser(req: Request): NonNullable<Request['user']> {
  if (!req.user) {
    throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required for this resource.');
  }

  return req.user;
}

function requireRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = ensureAuthenticatedUser(req);

      if (!allowedRoles.includes(user.role)) {
        throw new HttpError(403, 'AUTHORIZATION_ROLE_DENIED', 'User role is not permitted to access this resource.');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function requirePermissions(...requiredPermissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = ensureAuthenticatedUser(req);
      const hasAllPermissions = requiredPermissions.every((permission) => user.permissions.includes(permission));

      if (!hasAllPermissions) {
        throw new HttpError(
          403,
          'AUTHORIZATION_PERMISSION_DENIED',
          'User does not have the required permissions for this resource.',
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export { requirePermissions, requireRoles };
