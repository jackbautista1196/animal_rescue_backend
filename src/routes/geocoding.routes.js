import express from 'express';
import { reverseGeocode } from '../controllers/geocoding.controller.js';

const router = express.Router();

// GET /api/geocoding/reverse?latitude=-13.41&longitude=-76.13
router.get('/reverse', reverseGeocode);

export default router;