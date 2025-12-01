import express from 'express';
import { 
  getMyMatches,
  getMatchesForReport,
  markMatchAsNotified
} from '../controllers/match.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/my-matches', authenticateUser, getMyMatches);
router.get('/report/:reportId', authenticateUser, getMatchesForReport);
router.patch('/:matchId/notified', authenticateUser, markMatchAsNotified);

export default router;
