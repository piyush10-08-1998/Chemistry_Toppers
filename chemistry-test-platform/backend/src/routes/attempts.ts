import { Router } from 'express';
import { startTest, submitAnswer, submitTest, getTestResults } from '../controllers/attemptController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/start/:testId', requireRole(['student']), startTest);
router.post('/answer', requireRole(['student']), submitAnswer);
router.post('/submit', requireRole(['student']), submitTest);
router.get('/results/:testId', getTestResults);

export default router;