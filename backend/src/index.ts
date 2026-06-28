import { initializeAIInfrastructure } from './ai';
import logger from './utils/logger';
import { createApp } from './app';
import { loadConfig } from './config';
import { initializeFirebase } from './config/firebase';
import { initializeGemini } from './config/gemini';
import { initializeMaps } from './config/maps';

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
  await initializeAIInfrastructure(config);
  logger.info('All cloud services initialized');

  const app = createApp();

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
