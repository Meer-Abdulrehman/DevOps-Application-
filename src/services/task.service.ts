import { TaskModel } from '../models/task.model';
import { AppError } from '../utils/AppError';
import type { CreateTaskInput, UpdateTaskInput } from '../validators/task.validator';

export async function createTask(input: CreateTaskInput) {
  return TaskModel.create(input);
}

export async function getAllTasks() {
  return TaskModel.find().sort({ createdAt: -1 });
}

export async function getTaskById(id: string) {
  const task = await TaskModel.findById(id);
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const task = await TaskModel.findByIdAndUpdate(id, input, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  const task = await TaskModel.findByIdAndDelete(id);
  if (!task) throw new AppError('Task not found', 404);
}
