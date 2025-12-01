import express from 'express';
import { 
  getNearbyShelters,
  getAllShelters,
  getShelterById
} from '../controllers/shelter.controller.js';

const router = express.Router();

router.get('/nearby', getNearbyShelters);
router.get('/', getAllShelters);
router.get('/:id', getShelterById);

export default router;
