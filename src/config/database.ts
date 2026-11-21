import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDatabase(uri: string): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err: Error) => logger.error('MongoDB error', { error: err.message }));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}

const STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export function getDatabaseStatus(): string {
  return STATES[mongoose.connection.readyState] ?? 'unknown';
}
