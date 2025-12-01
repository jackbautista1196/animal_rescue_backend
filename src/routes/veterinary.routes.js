import express from 'express';
import { 
  getNearbyVeterinaries,
  getAllVeterinaries,
  getVeterinaryById
} from '../controllers/veterinary.controller.js';

const router = express.Router();

router.get('/nearby', getNearbyVeterinaries);
router.get('/', getAllVeterinaries);
router.get('/:id', getVeterinaryById);

export default router;
