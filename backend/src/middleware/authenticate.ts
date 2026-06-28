import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/HttpError';
import type { AuthService } from '../services/auth/types';

function extractBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader) {
    throw new HttpError(401, 'AUTH_TOKEN_MISSING', 'Authentication token is required.');
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'AUTH_TOKEN_INVALID', 'Authorization header must use Bearer token format.');
  }

  return token;
}

function requireAuthentication(authService: AuthService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractBearerToken(req.header('authorization'));
      req.user = await authService.verifyIdToken(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export { extractBearerToken, requireAuthentication };
