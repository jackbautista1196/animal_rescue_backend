import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener refugios cercanos
export const getNearbyShelters = async (req, res) => {
  try {
    const { latitude, longitude, radius = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Se requieren coordenadas (latitude, longitude)' 
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const shelters = await prisma.shelter.findMany({
      where: {
        isActive: true,
        latitude: {
          gte: lat - latDelta,
          lte: lat + latDelta
        },
        longitude: {
          gte: lon - lonDelta,
          lte: lon + lonDelta
        }
      }
    });

    // Calcular distancia y ordenar
    const sheltersWithDistance = shelters
      .map(shelter => ({
        ...shelter,
        distance: calculateDistance(lat, lon, shelter.latitude, shelter.longitude)
      }))
      .filter(shelter => shelter.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      count: sheltersWithDistance.length,
      shelters: sheltersWithDistance
    });

  } catch (error) {
    console.error('Error en getNearbyShelters:', error);
    res.status(500).json({ error: 'Error al obtener refugios' });
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Obtener todos los refugios
export const getAllShelters = async (req, res) => {
  try {
    const { isActive, district } = req.query;

    const whereClause = {};
    
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (district) whereClause.district = district;

    const shelters = await prisma.shelter.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    res.json({
      count: shelters.length,
      shelters
    });

  } catch (error) {
    console.error('Error en getAllShelters:', error);
    res.status(500).json({ error: 'Error al obtener refugios' });
  }
};

// Obtener un refugio por ID
export const getShelterById = async (req, res) => {
  try {
    const { id } = req.params;

    const shelter = await prisma.shelter.findUnique({
      where: { id }
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    res.json({ shelter });

  } catch (error) {
    console.error('Error en getShelterById:', error);
    res.status(500).json({ error: 'Error al obtener refugio' });
  }
};
