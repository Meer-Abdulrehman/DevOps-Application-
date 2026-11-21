import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';

/** Logs one line per request once the response has been sent. */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(level, `${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs.toFixed(1)}ms`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}
