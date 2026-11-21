import { z } from 'zod';
import { TASK_STATUSES } from '../models/task.model';

export const createTaskSchema = z.strictObject({
  title: z.string().trim().min(1, 'title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(TASK_STATUSES).optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const taskIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid task id'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
