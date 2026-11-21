import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err instanceof SyntaxError && 'body' in err) {
    // Malformed JSON body from express.json()
    statusCode = 400;
    message = 'Malformed JSON in request body';
  }

  if (statusCode >= 500) {
    logger.error('Unhandled error', {
      method: req.method,
      url: req.originalUrl,
      error: err instanceof Error ? err.stack : String(err),
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(details !== undefined && { details }),
      // Only leak stack traces outside production.
      ...(env.NODE_ENV === 'development' && statusCode >= 500 && err instanceof Error && { stack: err.stack }),
    },
  });
}
