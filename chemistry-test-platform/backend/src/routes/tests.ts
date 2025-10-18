import { Router } from 'express';
import { createTest, getTests, getTest, addQuestion, deleteTest, togglePublishTest } from '../controllers/testController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', requireRole(['teacher']), createTest);
router.get('/', getTests);
router.get('/:id', getTest);
router.post('/:id/questions', requireRole(['teacher']), addQuestion);
router.patch('/:id/publish', requireRole(['teacher']), togglePublishTest);
router.delete('/:id', requireRole(['teacher']), deleteTest);

export default router;