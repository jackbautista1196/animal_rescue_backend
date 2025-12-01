import express from 'express';
import { uploadImage, deleteImage } from '../controllers/upload.controller.js';
import { authenticateUser } from '../middleware/auth.middleware.js';
import upload from '../config/multer.js';

const router = express.Router();

// Subir imagen (requiere autenticación)
router.post('/image', authenticateUser, upload.single('image'), uploadImage);

// Eliminar imagen (requiere autenticación)
router.delete('/image', authenticateUser, deleteImage);

export default router;
