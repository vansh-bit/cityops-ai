import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { FirebaseAuthService } from './services/auth/authService';
import type { AuthService } from './services/auth/types';
import errorHandler from './middleware/errorHandler';
import requestLogger from './middleware/requestLogger';
import healthRouter from './routes/health';
import createUsersRouter from './routes/users';
import demoRouter from './routes/demo';

interface AppDependencies {
  authService?: AuthService;
}

function createApp(dependencies: AppDependencies = {}) {
  const authService = dependencies.authService ?? new FirebaseAuthService();
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use(healthRouter);
  app.use(demoRouter);
  app.use(createUsersRouter(authService));

  app.use(errorHandler);

  return app;
}

export { createApp };
