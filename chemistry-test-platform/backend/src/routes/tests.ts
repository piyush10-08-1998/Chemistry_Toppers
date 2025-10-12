import { Router } from 'express';
import { createTest, getTests, getTest, addQuestion, deleteTest } from '../controllers/testController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', requireRole(['teacher']), createTest);
router.get('/', getTests);
router.get('/:id', getTest);
router.post('/:id/questions', requireRole(['teacher']), addQuestion);
router.delete('/:id', requireRole(['teacher']), deleteTest);

export default router;