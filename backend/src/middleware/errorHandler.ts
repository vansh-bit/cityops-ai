import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  logger.error('Unhandled error', {
    message: err.message,
    statusCode,
    isOperational,
    stack: err.stack,
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: isOperational ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export default errorHandler;
