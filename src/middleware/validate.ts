import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'params' | 'query';

/**
 * Validates req[source] against a Zod schema.
 * On success the parsed (sanitized) value replaces the body; on failure a 400 is raised.
 */
export const validate =
  (schema: ZodType, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError('Validation failed', 400, details));
    }

    // req.query / req.params are getters in Express 5, so only overwrite the body.
    if (source === 'body') req.body = result.data;
    next();
  };
