import { Router, type Request, type Response } from 'express';
import {
  API_PREFIX,
  PERMISSIONS,
  type ApiSuccessResponse,
  type GetCurrentUserResponseData,
} from 'cityops-ai-shared';
import { requireAuthentication } from '../middleware/authenticate';
import { requirePermissions } from '../middleware/authorize';
import type { AuthService } from '../services/auth/types';

function createUsersRouter(authService: AuthService): Router {
  const usersRouter = Router();

  usersRouter.get(
    `${API_PREFIX}/users/me`,
    requireAuthentication(authService),
    requirePermissions(PERMISSIONS.viewOwnProfile),
    (req: Request, res: Response) => {
      const response: ApiSuccessResponse<GetCurrentUserResponseData> = {
        success: true,
        message: 'Authenticated user profile retrieved successfully',
        data: {
          user: req.user!,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  return usersRouter;
}

export default createUsersRouter;
