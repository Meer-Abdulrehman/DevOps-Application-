import winston from 'winston';
import { env } from './env';

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts as string} [${level}]: ${(stack as string) ?? (message as string)}${metaStr}`;
});

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  // Structured JSON logs in production are easy to ship to log aggregators later.
  format:
    env.NODE_ENV === 'production'
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(colorize(), timestamp(), errors({ stack: true }), devFormat),
  transports: [new winston.transports.Console()],
  // Keep test output clean.
  silent: env.NODE_ENV === 'test',
});
