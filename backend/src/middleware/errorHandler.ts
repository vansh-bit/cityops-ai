import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  details?: string[];
}

/**
 * Global error handler — Ch.4 §4.25 common error contract.
 *
 * Response format:
 * {
 *   success: false,
 *   error: { code, message, details },
 *   timestamp: ISO-8601 UTC
 * }
 *
 * Stack traces are logged server-side but never returned to clients (Ch.4 §4.40).
 */
function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const isOperational = err.isOperational || false;

  logger.error('Unhandled error', {
    message: err.message,
    code: errorCode,
    statusCode,
    isOperational,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: isOperational ? err.message : 'Internal server error',
      details: err.details || [],
    },
    timestamp: new Date().toISOString(),
  });
}

export default errorHandler;
