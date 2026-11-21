import request from 'supertest';
import { createApp } from '../src/app';
import { closeTestDb, connectTestDb } from './helpers/db';

const app = createApp();

describe('GET /health', () => {
  it('returns 503 when the database is not connected', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ status: 'error', database: 'disconnected' });
    expect(typeof res.body.uptime).toBe('number');
  });

  describe('with a database connection', () => {
    beforeAll(connectTestDb);
    afterAll(closeTestDb);

    it('returns 200 with status, uptime and database state', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'ok', database: 'connected' });
      expect(typeof res.body.uptime).toBe('number');
      expect(typeof res.body.timestamp).toBe('string');
    });
  });
});

describe('Unknown routes', () => {
  it('returns 404 JSON error', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toMatch(/not found/i);
  });
});
