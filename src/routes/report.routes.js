import express from 'express';
import { 
  createReport, 
  getNearbyReports, 
  getReportById,
  getMyReports,
  updateReportStatus
} from '../controllers/report.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', authenticateUser, createReport);
router.get('/nearby', getNearbyReports);
router.get('/my-reports', authenticateUser, getMyReports);
router.get('/:id', getReportById);
router.patch('/:id/status', authenticateUser, updateReportStatus);

export default router;
