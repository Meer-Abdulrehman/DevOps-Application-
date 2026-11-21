import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { validate } from '../middleware/validate';
import { createTaskSchema, taskIdParamSchema, updateTaskSchema } from '../validators/task.validator';

const router = Router();

router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/:id', validate(taskIdParamSchema, 'params'), taskController.getTaskById);
router.patch(
  '/:id',
  validate(taskIdParamSchema, 'params'),
  validate(updateTaskSchema),
  taskController.updateTask,
);
router.delete('/:id', validate(taskIdParamSchema, 'params'), taskController.deleteTask);

export default router;
