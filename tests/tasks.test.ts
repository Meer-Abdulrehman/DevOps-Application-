import request from 'supertest';
import { createApp } from '../src/app';
import { clearTestDb, closeTestDb, connectTestDb } from './helpers/db';

const app = createApp();
const NON_EXISTENT_ID = '507f1f77bcf86cd799439011';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

async function createTask(body: Record<string, unknown> = { title: 'Learn Docker' }) {
  const res = await request(app).post('/api/tasks').send(body);
  return res.body.data;
}

describe('POST /api/tasks', () => {
  it('creates a task with default status', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Learn Docker', description: 'Write a Dockerfile' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      title: 'Learn Docker',
      description: 'Write a Dockerfile',
      status: 'pending',
    });
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data._id).toBeUndefined();
    expect(res.body.data.createdAt).toBeDefined();
    expect(res.body.data.updatedAt).toBeDefined();
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'no title' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'title' })]),
    );
  });

  it('returns 400 for an invalid status', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x', status: 'done' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for unknown fields', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x', priority: 'high' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send('{"title": ');

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/malformed json/i);
  });
});

describe('GET /api/tasks', () => {
  it('returns an empty list when there are no tasks', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, count: 0, data: [] });
  });

  it('returns all tasks', async () => {
    await createTask({ title: 'Task 1' });
    await createTask({ title: 'Task 2' });

    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns a task by id', async () => {
    const task = await createTask();
    const res = await request(app).get(`/api/tasks/${task.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: task.id, title: 'Learn Docker' });
  });

  it('returns 404 for a non-existent task', async () => {
    const res = await request(app).get(`/api/tasks/${NON_EXISTENT_ID}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await request(app).get('/api/tasks/not-a-valid-id');
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/tasks/:id', () => {
  it('updates a task', async () => {
    const task = await createTask();
    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'in-progress', title: 'Learn Docker deeply' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: task.id,
      title: 'Learn Docker deeply',
      status: 'in-progress',
    });
  });

  it('returns 400 for an empty body', async () => {
    const task = await createTask();
    const res = await request(app).patch(`/api/tasks/${task.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid status', async () => {
    const task = await createTask();
    const res = await request(app).patch(`/api/tasks/${task.id}`).send({ status: 'nope' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent task', async () => {
    const res = await request(app).patch(`/api/tasks/${NON_EXISTENT_ID}`).send({ title: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task', async () => {
    const task = await createTask();

    const res = await request(app).delete(`/api/tasks/${task.id}`);
    expect(res.status).toBe(204);

    const after = await request(app).get(`/api/tasks/${task.id}`);
    expect(after.status).toBe(404);
  });

  it('returns 404 for a non-existent task', async () => {
    const res = await request(app).delete(`/api/tasks/${NON_EXISTENT_ID}`);
    expect(res.status).toBe(404);
  });
});
