import express from 'express';
import { 
  loginAdmin,
  createVeterinary,
  updateVeterinary,
  updateVeterinaryPlan,
  deleteVeterinary,
  toggleVeterinaryStatus,
  createShelter,
  updateShelter,
  deleteShelter,
  toggleShelterStatus,
  getDashboardStats
} from '../controllers/admin.controller.js';
import { authenticateAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Auth admin (no requiere autenticación)
router.post('/login', loginAdmin);

// Dashboard (requiere autenticación admin)
router.get('/dashboard/stats', authenticateAdmin, getDashboardStats);

// Gestión de veterinarias
router.post('/veterinaries', authenticateAdmin, createVeterinary);
router.put('/veterinaries/:id', authenticateAdmin, updateVeterinary);
router.patch('/veterinaries/:id/plan', authenticateAdmin, updateVeterinaryPlan);
router.patch('/veterinaries/:id/toggle', authenticateAdmin, toggleVeterinaryStatus);
router.delete('/veterinaries/:id', authenticateAdmin, deleteVeterinary);

// Gestión de refugios
router.post('/shelters', authenticateAdmin, createShelter);
router.put('/shelters/:id', authenticateAdmin, updateShelter);
router.patch('/shelters/:id/toggle', authenticateAdmin, toggleShelterStatus);
router.delete('/shelters/:id', authenticateAdmin, deleteShelter);

export default router;
