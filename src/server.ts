import type { Server } from 'node:http';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { createApp } from './app';

let server: Server | undefined;
let isShuttingDown = false;

async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully...`);

  // Force exit if cleanup hangs (e.g. long-lived connections).
  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    if (server) {
      // Stop accepting new connections and wait for in-flight requests to finish.
      await new Promise<void>((resolve, reject) => server!.close((err) => (err ? reject(err) : resolve())));
      logger.info('HTTP server closed');
    }
    await disconnectDatabase();
  } catch (err) {
    logger.error('Error during shutdown', { error: err instanceof Error ? err.message : String(err) });
    exitCode = 1;
  }

  process.exit(exitCode);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// The process is in an unknown state after these, so log and exit; a process
// manager (Docker, systemd, PM2, ...) should restart it.
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.stack ?? err.message });
  void shutdown('uncaughtException', 1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    error: reason instanceof Error ? (reason.stack ?? reason.message) : String(reason),
  });
  void shutdown('unhandledRejection', 1);
});

async function start(): Promise<void> {
  try {
    await connectDatabase(env.MONGODB_URI);
    const app = createApp();
    server = app.listen(env.PORT, () => {
      logger.info(`Server listening on port ${env.PORT} (${env.NODE_ENV})`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

void start();
