import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

/**
 * Builds the Express app without starting a server or connecting to a DB.
 * This keeps it easy to test with Supertest.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Needed for correct req.ip when running behind a reverse proxy / load balancer.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(requestLogger);

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
