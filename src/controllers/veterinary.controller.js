import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener veterinarias cercanas (patrocinadas primero)
export const getNearbyVeterinaries = async (req, res) => {
  try {
    const { latitude, longitude, radius = 20 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Se requieren coordenadas (latitude, longitude)' 
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Aproximación para búsqueda
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    // Obtener veterinarias activas en el área
    const veterinaries = await prisma.veterinary.findMany({
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

    // Calcular distancia y filtrar
    const veterinariesWithDistance = veterinaries
      .map(vet => ({
        ...vet,
        distance: calculateDistance(lat, lon, vet.latitude, vet.longitude)
      }))
      .filter(vet => vet.distance <= radiusKm);

    // ORDENAR: Primero las patrocinadas por plan, luego por distancia
    const sortedVeterinaries = veterinariesWithDistance.sort((a, b) => {
      // Orden de prioridad de planes
      const planPriority = {
        'ENTERPRISE': 4,
        'PREMIUM': 3,
        'BASIC': 2,
        'FREE': 1
      };

      const priorityA = planPriority[a.plan];
      const priorityB = planPriority[b.plan];

      // Si tienen diferente plan, ordenar por prioridad
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      // Si tienen el mismo plan, ordenar por distancia
      return a.distance - b.distance;
    });

    res.json({
      count: sortedVeterinaries.length,
      veterinaries: sortedVeterinaries
    });

  } catch (error) {
    console.error('Error en getNearbyVeterinaries:', error);
    res.status(500).json({ error: 'Error al obtener veterinarias' });
  }
};

// Calcular distancia (Haversine)
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

// Obtener todas las veterinarias (para admin)
export const getAllVeterinaries = async (req, res) => {
  try {
    const { plan, isActive, district } = req.query;

    const whereClause = {};
    
    if (plan) whereClause.plan = plan;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    if (district) whereClause.district = district;

    const veterinaries = await prisma.veterinary.findMany({
      where: whereClause,
      orderBy: [
        { plan: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      count: veterinaries.length,
      veterinaries
    });

  } catch (error) {
    console.error('Error en getAllVeterinaries:', error);
    res.status(500).json({ error: 'Error al obtener veterinarias' });
  }
};

// Obtener una veterinaria por ID
export const getVeterinaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const veterinary = await prisma.veterinary.findUnique({
      where: { id }
    });

    if (!veterinary) {
      return res.status(404).json({ error: 'Veterinaria no encontrada' });
    }

    res.json({ veterinary });

  } catch (error) {
    console.error('Error en getVeterinaryById:', error);
    res.status(500).json({ error: 'Error al obtener veterinaria' });
  }
};
