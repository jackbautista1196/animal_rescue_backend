import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Subir imagen a Cloudinary
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    // Convertir buffer a stream
    const stream = Readable.from(req.file.buffer);

    // Subir a Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'animal-rescue',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Limitar tamaño máximo
            { quality: 'auto:good' }, // Optimización automática
            { fetch_format: 'auto' }, // Formato óptimo
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.pipe(uploadStream);
    });

    const result = await uploadPromise;

    res.json({
      message: 'Imagen subida exitosamente',
      url: result.secure_url,
      publicId: result.public_id,
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ 
      error: 'Error al subir la imagen',
      details: error.message 
    });
  }
};

// Eliminar imagen de Cloudinary
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'publicId es requerido' });
    }

    await cloudinary.uploader.destroy(publicId);

    res.json({
      message: 'Imagen eliminada exitosamente',
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ 
      error: 'Error al eliminar la imagen',
      details: error.message 
    });
  }
};
