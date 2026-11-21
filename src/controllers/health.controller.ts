import type { Request, Response } from 'express';
import { getDatabaseStatus } from '../config/database';

export function getHealth(_req: Request, res: Response): void {
  const database = getDatabaseStatus();
  const healthy = database === 'connected';

  // 503 lets load balancers / orchestrators know this instance can't serve traffic.
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'error',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database,
  });
}
