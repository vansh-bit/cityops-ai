import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import logger from './utils/logger';
import { loadConfig } from './config';
import { initializeFirebase } from './config/firebase';
import { initializeGemini } from './config/gemini';
import { initializeMaps } from './config/maps';
import healthRouter from './routes/health';
import requestLogger from './middleware/requestLogger';
import errorHandler from './middleware/errorHandler';

async function bootstrap(): Promise<void> {
  // ── Load & validate configuration ──
  logger.info('Loading configuration...');
  const config = loadConfig();
  logger.info('Configuration loaded successfully', {
    port: config.port,
    environment: config.nodeEnv,
  });

  // ── Initialize cloud services ──
  logger.info('Initializing cloud services...');
  initializeFirebase(config);
  initializeGemini(config);
  initializeMaps(config);
  logger.info('All cloud services initialized');

  // ── Create Express app ──
  const app = express();

  // ── Middleware ──
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // ── Routes ──
  app.use(healthRouter);

  // ── Error handling ──
  app.use(errorHandler);

  // ── Start server ──
  app.listen(config.port, () => {
    logger.info(`CityOps AI Backend running on port ${config.port}`, {
      environment: config.nodeEnv,
      pid: process.pid,
    });
  });
}

// ── Startup ──
bootstrap().catch((error) => {
  logger.error('Failed to start server', { error: error.message, stack: error.stack });
  process.exit(1);
});

// ── Graceful shutdown ──
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection', { reason });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});
