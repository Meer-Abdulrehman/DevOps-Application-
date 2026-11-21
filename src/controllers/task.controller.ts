import type { Request, Response } from 'express';
import * as taskService from '../services/task.service';

// Express 5 forwards rejected promises from async handlers to the error handler,
// so no try/catch boilerplate is needed here.

type IdParams = { id: string };

export async function createTask(req: Request, res: Response): Promise<void> {
  const task = await taskService.createTask(req.body);
  res.status(201).json({ success: true, data: task });
}

export async function getAllTasks(_req: Request, res: Response): Promise<void> {
  const tasks = await taskService.getAllTasks();
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
}

export async function getTaskById(req: Request<IdParams>, res: Response): Promise<void> {
  const task = await taskService.getTaskById(req.params.id);
  res.status(200).json({ success: true, data: task });
}

export async function updateTask(req: Request<IdParams>, res: Response): Promise<void> {
  const task = await taskService.updateTask(req.params.id, req.body);
  res.status(200).json({ success: true, data: task });
}

export async function deleteTask(req: Request<IdParams>, res: Response): Promise<void> {
  await taskService.deleteTask(req.params.id);
  res.status(204).send();
}
