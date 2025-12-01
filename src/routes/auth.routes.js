import express from 'express';
import { register, login, getProfile, updateProfile, changePassword, getUserStats } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticateUser, getProfile);
router.put('/profile', authenticateUser, updateProfile);
router.post('/change-password', authenticateUser, changePassword);
router.get('/stats', authenticateUser, getUserStats);

export default router;