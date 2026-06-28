import { Router, Request, Response } from 'express';
import { ApiSuccessResponse, HealthData, API_PREFIX } from 'cityops-ai-shared';

const healthRouter = Router();

/**
 * GET /api/v1/health
 * Public endpoint — no authentication required.
 * Returns service health status per Chapter 4 §4.24 common success contract.
 */
healthRouter.get(`${API_PREFIX}/health`, (_req: Request, res: Response) => {
  const response: ApiSuccessResponse<HealthData> = {
    success: true,
    message: 'Service is healthy',
    data: {
      status: 'ok',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
});

export default healthRouter;
