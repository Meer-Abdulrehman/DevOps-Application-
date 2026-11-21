import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import taskRoutes from './task.routes';

const router = Router();

router.get('/health', getHealth);
router.use('/api/tasks', taskRoutes);

export default router;
